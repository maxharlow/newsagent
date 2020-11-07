import WorkerThreads from 'worker_threads'
import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        settings: Zod.object({
            method: Zod.string().regex(/log/),
        }),
        item: Zod.object({
            id: Zod.string(),
            difference: Zod.string().regex(/addition|removal/),
            content: Zod.union([Zod.string(), Zod.object()])
        })
    })
    schema.parse(source)
}

async function run(name, settings, item) {
    validate({ name, settings, item })
    WorkerThreads.parentPort.postMessage({
        event: 'alert-log',
        data: { difference: item.difference, content: item.content }
    })
}

export default run
