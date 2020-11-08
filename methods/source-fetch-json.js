import Zod from 'zod'
import Axios from 'axios'
import JmesPath from 'jmespath'

function validate(source) {
    const schema = Zod.object({
        method: Zod.string(),
        url: Zod.string().url(),
        selection: Zod.string()
    })
    schema.parse(source)
}

async function run(source) {
    validate(source)
    const response = await Axios.get(source.url)
    return [JmesPath.search(response.data, source.selection)].flat()
}

export default run
