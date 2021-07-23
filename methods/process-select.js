import * as Zod from 'zod'
import JmesPath from 'jmespath'

function validate(source) {
    const schema = Zod.object({
        content: Zod.object(),
        difference: Zod.string().regex(/addition|removal/),
        settings: Zod.object({
            fields: Zod.object()
        })
    })
    schema.parse(source)
    Object.keys(source.fields).forEach(field => {
        if (source.content[source.settings.field === undefined]) throw new Error(`'${field}' field not found in content`)
    })
}

async function run(content, difference, settings) {
    validate({ content, difference, settings })
    const entries = Object.entries(settings.fields).map(([key, value]) => {
        const selection = JmesPath.search(content, value)
        return [key, selection]
    })
    return Object.fromEntries(entries)
}

export default run
