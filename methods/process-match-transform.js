import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        settings: Zod.object({
            method: Zod.string(),
            match: Zod.string(),
            transform: Zod.string()
        }),
        change: Zod.object({
            id: Zod.string(),
            difference: Zod.string().regex(/addition|removal/),
            content: Zod.string()
        })
    })
    schema.parse(source)
}

async function run(settings, change) {
    validate({ settings, change })
    const matches = change.content.match(new RegExp(settings.match))
    if (!matches) return null
    const transformed = matches.reduce((s, match, i) => {
        return s.replace(`\\${i}`, match)
    }, settings.transform)
    return { ...change, content: transformed }
}

export default run
