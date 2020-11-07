import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        settings: Zod.object({
            method: Zod.string().regex(/find-and-replace/),
            find: Zod.string(),
            replace: Zod.string()
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
    const transformed = change.content.replace(new RegExp(settings.find, 'g'), settings.replace)
    return { ...change, content: transformed }
}

export default run
