import * as Zod from 'zod'
import Notifier from 'node-notifier'
import Open from 'open'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        difference: Zod.string().regex(/addition|removal/),
        content: Zod.union([Zod.string(), Zod.object()]),
        settings: Zod.object({
            bodyField: Zod.string().optional(),
            urlField: Zod.string().optional()
        })
    })
    schema.parse(source)
}

async function run(name, difference, content, settings) {
    validate({ name, difference, content, settings })
    const body = settings.bodyField ? content[settings.bodyField]
        : typeof content === 'string' ? content
        : JSON.stringify(content)
    Notifier.notify({
        title: `Newsagent alert: ${name}`,
        message: body
    })
    if (settings.urlField) Notifier.on('click', () => {
        Open(content[settings.urlField])
    })
}

export default run
