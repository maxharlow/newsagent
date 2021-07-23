import * as Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.object(),
        difference: Zod.string().regex(/addition|removal/),
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
    if (typeof content === 'object') Object.keys(content).forEach(key => {
        if (key === 'difference') throw new Error('"difference" is a reserved field name')
    })
    return fields
}

async function run(content, difference, settings) {
    const fields = validate({ content, difference, settings })
    const output = fields.reduce((a, field) => {
        const value = field === 'difference' ? difference
            : Array.isArray(content[field]) ? content[field].join(', ')
            : content[field]
        return a.replace(`{{${field}}}`, value ? value : '')
    }, settings.combination)
    return settings.field ? { ...content, [settings.field]: output } : output
}

export default run
