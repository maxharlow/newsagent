import Zod from 'zod'
import Axios from 'axios'
import JmesPath from 'jmespath'

function validate(source) {
    const schema = Zod.object({
        method: Zod.string(),
        url: Zod.string().url(),
        selection: Zod.string(),
        subselection: Zod.object().optional()
    })
    schema.parse(source)
}

async function run(source) {
    validate(source)
    const response = await Axios.get(source.url)
    const items = [JmesPath.search(response.data, source.selection)].flat()
    if (!source.subselection) return items
    return items.map(item => {
        const entries = Object.entries(source.subselection).map(([key, value]) => {
            const selection = JmesPath.search(item, value)
            return [key, selection]
        })
        return Object.fromEntries(entries)
    })
}

export default run
