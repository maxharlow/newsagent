import Zod from 'zod'
import Axios from 'axios'
import Papaparse from 'papaparse'

function validate(source) {
    const schema = Zod.object({
        method: Zod.string(),
        url: Zod.string().url()
    })
    schema.parse(source)
}

async function run(source) {
    validate(source)
    const response = await Axios.get(source.url)
    return Papaparse.parse(response.data, { header: true }).data
}

export default run
