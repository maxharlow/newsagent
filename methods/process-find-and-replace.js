import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object()]),
        settings: Zod.object({
            find: Zod.string(),
            replace: Zod.string(),
            field: Zod.string().optional()
        })
    })
    schema.parse(source)
    if (typeof source.content === 'object' && !source.settings.field) throw new Error('field needs to be specified')
    if (source.settings.field && source.content[source.settings.field] === undefined) throw new Error(`'${field}' field not found in content`)
}

async function run(content, settings) {
    validate({ content, settings })
    const text = [typeof content === 'object' ? content[settings.field] : content].flat().join(' ') // in case it's an array
    const transformed = text.replace(new RegExp(settings.find, 'g'), settings.replace)
    return settings.field ? { ...content, [settings.field]: transformed } : transformed
}

export default run
