import Zod from 'zod'

function validate(source) {
    const schema = Zod.object({
        content: Zod.union([Zod.string(), Zod.object(), Zod.array(Zod.string())]),
        settings: Zod.object({
            match: Zod.string(),
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

async function run(content, settings) {
    validate({ content, settings })
    const text = [typeof content === 'object' ? content[settings.field] : content].flat().join(' ') // in case it's an array
    const matches = text.match(withRegex(settings.match))
    if (!matches) return null
    return content
}

export default run
