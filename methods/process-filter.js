import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object()]),
        settings: Zod.object({
            match: Zod.string(),
            field: Zod.string().optional()
        })
    })
    schema.parse(source)
}

async function run(content, settings) {
    validate({ content, settings })
    const field = settings.field ? content[settings.field] : content
    const matches = field.match(new RegExp(settings.match))
    if (!matches) return null
    return content
}

export default run
