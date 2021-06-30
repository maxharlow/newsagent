import * as Zod from 'zod'
import Notifier from 'node-notifier'
import Open from 'open'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        difference: Zod.string().regex(/addition|removal/),
        content: Zod.union([Zod.string(), Zod.object()]),
        settings: Zod.object({
            field: Zod.string().optional(),
            url: Zod.string().optional()
        })
    })
    schema.parse(source)
}

async function run(name, difference, content, settings) {
    validate({ name, difference, content, settings })
    const body = settings.field ? content[settings.field]
        : typeof content === 'string' ? content
        : JSON.stringify(content)
    Notifier.notify({
        title: `Newsagent alert: ${name}`,
        message: `${difference.toUpperCase()}: ${body}`
    })
    if (settings.url) Notifier.on('click', () => {
        Open(content[settings.url])
    })
}

export default run
