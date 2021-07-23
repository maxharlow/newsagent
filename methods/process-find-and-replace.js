import * as Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object({}), Zod.array(Zod.string())]),
        difference: Zod.string().regex(/addition|removal/),
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

function withRegex(match) {
    if (match.split('').filter(c => c == '/').length < 2) throw new Error(`Invalid regular expression: ${match}`)
    const flagpoint = match.lastIndexOf('/')
    return RegExp(match.slice(1, flagpoint), match.slice(flagpoint + 1))
}

async function run(content, difference, settings) {
    validate({ content, difference, settings })
    const value = typeof content === 'object' ? content[settings.field] : content
    const transformed = Array.isArray(value)
        ? value.map(entry => entry.replace(withRegex(settings.find), settings.replace))
        : value.replace(withRegex(settings.find), settings.replace)
    return settings.field ? { ...content, [settings.field]: transformed } : transformed
}

export default run
