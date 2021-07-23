import Process from 'process'
import WorkerThreads from 'worker_threads'
import ObjectHash from 'object-hash'
import FSExtra from 'fs-extra'

async function sourcing() {
    const { method, ...settings } = watch.source // omit method name
    const { default: f } = await import(`./../methods/source-${watch.source.method}.js`)
    const items = await f(settings)
    return items.map(content => {
        const id = ObjectHash(content)
        return { id, content }
    })
}

async function diffing(items) {
    const key = ObjectHash(watch.source)
    const path = `.newsagent-cache/${key}`
    const hash = ObjectHash(items)
    const hashset = items.map(item => item.id)
    const cachefileExists = await FSExtra.pathExists(path)
    if (!cachefileExists) {
        await FSExtra.writeJson(path, { hash, hashset, amalgam: items })
        return []
    }
    const cachefile = await FSExtra.readJson(path)
    if (cachefile.hash === hash) return [] // whole-data hash is the same, so we can avoid looking at individual records
    const additions = () => {
        return items.filter(item => !cachefile.hashset.includes(item.id)).map(item => {
            return { ...item, difference: 'addition' }
        })
    }
    const removals = () => {
        return cachefile.hashset.filter(hash => !hashset.includes(hash)).map(hash => {
            const item = cachefile.amalgam.find(item => item.id === hash)
            return { ...item, difference: 'removal' }
        })
    }
    const changesAdditions = watch.monitor === 'additions-and-removals' || watch.monitor === 'additions-only' ? additions() : []
    const changesRemovals = watch.monitor === 'additions-and-removals' || watch.monitor === 'removals-only' ? removals() : []
    const amalgam = cachefile.amalgam
        .filter(item => !changesRemovals.find(change => change.id === item.id))
        .concat(changesAdditions.map(change => ({ id: change.id, content: change.content }))) // so omit difference field
    await FSExtra.writeJson(path, { hash, hashset, amalgam })
    return [...changesAdditions, ...changesRemovals]
}

async function processing(changes) {
    if (!watch.processes) return changes
    return watch.processes.reduce(async (a, process) => {
        const { method, ...settings } = process // omit method name
        const { default: f } = await import(`./../methods/process-${process.method}.js`)
        const all = await Promise.all((await a).map(async change => {
            const contentNew = await f(change.content, change.difference, settings)
            return { ...change, content: contentNew }
        }))
        return all.filter(x => x.content)
    }, changes)
}

async function alerting(results) {
    const firings = watch.alerts.map(async alert => {
        const { method, ...settings } = alert // omit method name
        const { default: f } = await import(`./../methods/alert-${alert.method}.js`)
        results.forEach(result => f(watch.name, result.content, settings))
    })
    await Promise.all(firings)
}

async function execute() {
    try {
        const items = await sourcing()
        const changes = await diffing(items)
        const processed = await processing(changes)
        await alerting(processed)
    }
    catch (e) {
        if (e.constructor.name === 'ZodError') {
            const error = e.errors[0]
            WorkerThreads.parentPort.postMessage({
                event: 'execution-invalid',
                data: { error: `${error.message}: ${error.path.join('.')} wanted ${error.expected} but got ${error.received}` }
            })
        }
        else {
            WorkerThreads.parentPort.postMessage({
                event: 'execution-failure',
                data: { error: e.message }
            })
        }
        Process.exit(1)
    }
}

execute()
