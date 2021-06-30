import * as Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object(), Zod.array(Zod.string())]),
        settings: Zod.object({
            fields: Zod.object(),
            field: Zod.string().optional()
        })
    })
    if (typeof source.content === 'object' && !source.settings.field) throw new Error('field needs to be specified')
    if (source.settings.field && source.content[source.settings.field] === undefined) throw new Error(`'${field}' field not found in content`)
    schema.parse(source)
}

function withRegex(match) {
    if (match.split('').filter(c => c == '/').length < 2) throw new Error(`Invalid regular expression: ${match}`)
    const flagpoint = match.lastIndexOf('/')
    return RegExp(match.slice(1, flagpoint), match.slice(flagpoint + 1))
}

async function run(content, settings) {
    validate({ content, settings })
    const text = [typeof content === 'object' ? content[settings.field] : content].flat().join(' ') // in case it's an array
    const entries = Object.entries(settings.fields).map(([key, pattern]) => {
        const matched = text.match(withRegex(pattern))
        const value = !matched || matched.length === 0 ? null
            : matched.length === 1 ? matched[0]
            : matched
        return [key, value]
    })
    return { ...content, ...Object.fromEntries(entries) }
}

export default run
