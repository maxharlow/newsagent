import * as Zod from 'zod'
import Axios from 'axios'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        content: Zod.union([Zod.string(), Zod.object(), Zod.array(Zod.string())]),
        settings: Zod.object({
            url: Zod.string(),
            bodyField: Zod.string().optional()
        })
    })
    schema.parse(source)
    if (source.settings.bodyField && source.content[source.settings.bodyField] === undefined) throw new Error('body field not found in content')
}

async function run(name, content, settings) {
    validate({ name, content, settings })
    const body = settings.bodyField ? content[settings.bodyField]
        : Array.isArray(content) ? content.join(', ')
        : content
    await Axios({
        url: settings.url,
        method: 'POST',
        data: body
    })
}

export default run
