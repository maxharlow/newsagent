import * as Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.object(),
        settings: Zod.object({
            combination: Zod.string()
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
    return fields.reduce((a, field) => {
        const value = Array.isArray(content[field]) ? content[field].join(', ') : content[field]
        return a.replace(`{{${field}}}`, value ? value : '')
    }, settings.combination)
}

export default run
