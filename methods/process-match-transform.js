import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        settings: Zod.object({
            method: Zod.string().regex(/match-transform/),
            match: Zod.string(),
            transform: Zod.string(),
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
    const matches = field.match(new RegExp(settings.match))
    if (!matches) return null
    const transformed = matches.reduce((s, match, i) => {
        return s.replace(`\\${i}`, match)
    }, settings.transform)
    const contentUpdated = settings.field ? { ...change.content, [settings.field]: transformed } : transformed
    return { ...change, content: contentUpdated }
}

export default run
