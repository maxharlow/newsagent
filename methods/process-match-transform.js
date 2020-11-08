import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object()]),
        settings: Zod.object({
            match: Zod.string(),
            transform: Zod.string(),
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
    const transformed = matches.reduce((s, match, i) => {
        return s.replace(`\\${i}`, match)
    }, settings.transform)
    return settings.field ? { ...content, [settings.field]: transformed } : transformed
}

export default run
