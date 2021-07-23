import WorkerThreads from 'worker_threads'
import * as Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        content: Zod.union([Zod.string(), Zod.object({}), Zod.array(Zod.string())]),
        settings: Zod.object({})
    })
    schema.parse(source)
}

async function run(name, content, settings) {
    validate({ name, content, settings })
    WorkerThreads.parentPort.postMessage({
        event: 'alert-log',
        data: content
    })
}

export default run
