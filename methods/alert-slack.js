import * as Zod from 'zod'
import Axios from 'axios'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        difference: Zod.string().regex(/addition|removal/),
        content: Zod.union([Zod.string(), Zod.object(), Zod.array(Zod.string())]),
        settings: Zod.object({
            webhook: Zod.string(),
            field: Zod.string().optional()
        })
    })
    schema.parse(source)
    if (source.settings.field && source.content[source.settings.field] === undefined) throw new Error('field not found in content')
}

async function run(name, difference, content, settings) {
    validate({ name, difference, content, settings })
    const text = [
        typeof content === 'object' && settings.field ? content[settings.field]
            : typeof content === 'object' ? JSON.stringify(content)
            : content
    ].flat().join(' ') // in case it's an array
    await Axios({
        url: settings.webhook,
        method: 'POST',
        data: { text }
    })
}

export default run
