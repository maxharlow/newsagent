import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object(), Zod.array(Zod.string())]),
        settings: Zod.object({
            field: Zod.string().optional()
        })
    })
    if (!typeof source.content === 'object' && !source.settings.field) throw new Error('field needs to be specified')
    if (source.settings.field && source.content[source.settings.field] === undefined) throw new Error(`'${field}' field not found in content`)
    schema.parse(source)
}

async function run(content, settings) {
    validate({ content, settings })
    const value = typeof content === 'object' ? content[settings.field] : content
    const transformed = Array.isArray(value) ? value.map(entry => entry.trim()) : value.trim()
    return settings.field ? { ...content, [settings.field]: transformed } : transformed
}

export default run
