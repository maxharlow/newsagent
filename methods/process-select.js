import Zod from 'zod'
import JmesPath from 'jmespath'

function validate(source) {
    const schema = Zod.object({
        content: Zod.object(),
        settings: Zod.object({
            fields: Zod.object()
        })
    })
    schema.parse(source)
}

async function run(content, settings) {
    validate({ content, settings })
    const entries = Object.entries(settings.fields).map(([key, value]) => {
        const selection = JmesPath.search(content, value)
        return [key, selection]
    })
    return Object.fromEntries(entries)
}

export default run
