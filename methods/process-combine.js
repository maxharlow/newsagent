import * as Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.object(),
        settings: Zod.object({
            combination: Zod.string(),
            field: Zod.string().optional()
        })
    })
    schema.parse(source)
    const fields = Array.from(source.settings.combination.matchAll(/{{(.+?)}}/g)).map(([, field]) => field)
    fields.forEach(field => {
        if (source.content[field === undefined]) throw new Error(`'${field}' field not found in content`)
    })
    return fields
}

async function run(content, settings) {
    const fields = validate({ content, settings })
    const output = fields.reduce((a, field) => {
        const value = Array.isArray(content[field]) ? content[field].join(', ') : content[field]
        return a.replace(`{{${field}}}`, value ? value : '')
    }, settings.combination)
    return settings.field ? { ...content, [settings.field]: output } : output
}

export default run
