import * as Zod from 'zod'
import Axios from 'axios'
import JmesPath from 'jmespath'

function validate(settings) {
    const schema = Zod.object({
        url: Zod.string().url(),
        selection: Zod.string()
    })
    schema.parse(settings)
}

async function run(settings) {
    validate(settings)
    const response = await Axios.get(settings.url)
    return [JmesPath.search(response.data, settings.selection)].flat()
}

export default run
