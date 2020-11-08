import Zod from 'zod'
import ObjectHash from 'object-hash'
import Axios from 'axios'
import Cheerio from 'cheerio'
import Playwright from 'playwright'

function validate(source) {
    const schema = Zod.object({
        method: Zod.string(),
        url: Zod.string().url(),
        browser: Zod.string().regex(/chromium|webkit|firefox/).optional(),
        selection: Zod.string()
    })
    schema.parse(source)
}

async function withBrowser(source) {
    const browser = await Playwright[source.browser].launch()
    const page = await browser.newPage()
    await page.goto(source.url)
    await page.waitForSelector(source.selection, { state: 'attached' })
    const items = await page.$$eval(source.selection, elements => {
        return elements.map(element => element.textContent)
    })
    await browser.close()
    return items
}

async function withoutBrowser(source) {
    const response = await Axios.get(source.url)
    const page = Cheerio.load(response.data)
    const items = page(source.selection).get().map(item => Cheerio(item).text())
    return items
}

async function run(source) {
    validate(source)
    const items = await (source.browser ? withBrowser : withoutBrowser)(source)
    return items.map(content => {
        const id = ObjectHash(content)
        return { id, content }
    })
}

export default run
