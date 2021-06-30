import WorkerThreads from 'worker_threads'
import * as Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        difference: Zod.string().regex(/addition|removal/),
        content: Zod.union([Zod.string(), Zod.object(), Zod.array(Zod.string())]),
        settings: Zod.object()
    })
    schema.parse(source)
}

async function run(name, difference, content, settings) {
    validate({ name, difference, content, settings })
    WorkerThreads.parentPort.postMessage({
        event: 'alert-log',
        data: { difference, content }
    })
}

export default run
