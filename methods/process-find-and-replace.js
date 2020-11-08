import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object()]),
        settings: Zod.object({
            find: Zod.string(),
            replace: Zod.string(),
            field: Zod.string().optional()
        }),
    })
    schema.parse(source)
}

async function run(content, settings) {
    validate({ content, settings })
    const field = settings.field ? content[settings.field] : content
    const transformed = field.replace(new RegExp(settings.find, 'g'), settings.replace)
    return settings.field ? { ...content, [settings.field]: transformed } : transformed
}

export default run
