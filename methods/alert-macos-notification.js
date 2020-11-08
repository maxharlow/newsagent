import Zod from 'zod'
import Notifier from 'node-notifier'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        difference: Zod.string().regex(/addition|removal/),
        content: Zod.union([Zod.string(), Zod.object()]),
        settings: Zod.object({
            field: Zod.string().optional()
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
}

export default run
