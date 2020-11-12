import Process from 'process'
import FSExtra from 'fs-extra'
import Bree from 'bree'
import Zod from 'zod'

function validate(watch) {
    const schema = Zod.object({
        name: Zod.string(),
        source: Zod.object({ method: Zod.string() }).nonstrict(),
        schedule: Zod.string(),
        monitor: Zod.string().regex(/additions-only|additions-and-removals|removals-only/),
        processes: Zod.array(Zod.object({ method: Zod.string() }).nonstrict()).optional(),
        alerts: Zod.array(Zod.object({ method: Zod.string() }).nonstrict())
    })
    return schema.safeParse(watch)
}

async function generate(watch, i) {
    const executor = await FSExtra.readFile('executor.js')
    const id = watch.name.toLowerCase().replace(/[^a-z ]+/g, '').replace(/ /g, '-')
    const code = `const watch = ${JSON.stringify(watch)}\n` + executor
    const path = `./.newsagent-jobs/job-${i + 1}-${id}.js`
    await FSExtra.writeFile(path, code)
    return path
}

async function run(watches, message = () => {}) {
    await FSExtra.remove('.newsagent-jobs')
    await FSExtra.ensureDir('.newsagent-jobs')
    await FSExtra.ensureDir('.newsagent-cache')
    Process.on('SIGINT', async () => {
        await FSExtra.remove('.newsagent-jobs')
        process.exit()
    })
    const jobsGeneration = watches.map(async (watch, i) => {
        const validation = validate(watch)
        if (validation.error) {
            const error = validation.error.errors[0]
            message(watch.name, 'watch-invalid', {
                error: `${error.message}: ${error.path.join('.')} wanted ${error.expected} but got ${error.received}`
            })
            return null
        }
        return {
            name: watch.name,
            path: await generate(watch, i),
            interval: watch.schedule
        }
    })
    const jobs = (await Promise.all(jobsGeneration)).filter(x => x)
    if (jobs.length === 0) throw new Error('nothing to watch!')
    const logger = {
        info: (text, metadata) => {
            if (text.startsWith('Worker for job') && text.endsWith('online')) {
                const source = text.split('"')[1]
                message(source, 'worker-starting')
            }
            else if (text.startsWith('Worker for job') && text.endsWith('exited with code 0')) {
                const source = text.split('"')[1]
                message(source, 'worker-finished')
            }
            else if (text.startsWith('Worker for job') && text.endsWith('sent a message')) {
                const source = text.split('"')[1]
                message(source, metadata.message.event, metadata.message.data)
            }
            else message(null, 'INFO', { text, metadata })
        },
        warn: (e, metadata) => {
            if (e.message.startsWith('Job') && e.message.endsWith('is already running')) {
                const source = e.message.split('"')[1]
                message(source, 'worker-still-running')
            }
            else message(null, 'WARN', { text: e.message, metadata })
        },
        error: (e, metadata) => {
            if (typeof e === 'string' && e.startsWith('Worker for job') && e.endsWith('exited with code 1')) {
                const source = e.split('"')[1]
                message(source, 'worker-execution-failure')
            }
            else message(null, 'ERROR', { text: e.message || e, ...(metadata ? { metadata } : {}) })
        }
    }
    new Bree({
        root: false,
        logger,
        jobs
    }).start()
}

export default run
