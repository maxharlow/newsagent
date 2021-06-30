import * as Zod from 'zod'
import Axios from 'axios'
import Papaparse from 'papaparse'

function validate(source) {
    const schema = Zod.object({
        url: Zod.string().url()
    })
    schema.parse(source)
}

async function run(settings) {
    validate(settings)
    const response = await Axios.get(settings.url)
    return Papaparse.parse(response.data, { header: true }).data
}

export default run
