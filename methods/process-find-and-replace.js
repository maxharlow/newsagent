import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        settings: Zod.object({
            method: Zod.string().regex(/find-and-replace/),
            find: Zod.string(),
            replace: Zod.string(),
            field: Zod.string().optional()
        }),
        change: Zod.object({
            id: Zod.string(),
            difference: Zod.string().regex(/addition|removal/),
            content: Zod.union([Zod.string(), Zod.object()])
        })
    })
    schema.parse(source)
}

async function run(settings, change) {
    validate({ settings, change })
    const field = settings.field ? change.content[settings.field] : change.content
    const transformed = field.replace(new RegExp(settings.find, 'g'), settings.replace)
    const contentUpdated = settings.field ? { ...change.content, [settings.field]: transformed } : transformed
    return { ...change, content: contentUpdated }
}

export default run
