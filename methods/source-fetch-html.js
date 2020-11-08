import Zod from 'zod'
import Axios from 'axios'
import Cheerio from 'cheerio'
import Playwright from 'playwright'

function validate(source) {
    const schema = Zod.object({
        method: Zod.string(),
        url: Zod.string().url(),
        browser: Zod.string().regex(/chromium|webkit|firefox/).optional(),
        selection: Zod.string(),
        subselection: Zod.object().optional()
    })
    schema.parse(source)
}

async function withBrowser(source) {
    const browser = await Playwright[source.browser].launch()
    const page = await browser.newPage()
    await page.goto(source.url)
    await page.waitForSelector(source.selection, { state: 'attached' })
    const items = await page.$$eval(source.selection, (elements, subselection) => {
        return elements.map(element => {
            if (!subselection) return element.textContent
            const entries = Object.entries(subselection).map(([key, value]) => {
                const valueContents = Array.from(element.querySelectorAll(value)).map(node => node.textContent)
                const valueContent = valueContents.length === 0 ? null
                    : valueContents.length === 1 ? valueContents[0]
                    : valueContents
                return [key, valueContent]
            })
            return Object.fromEntries(entries)
        })
    }, source.subselection)
    await browser.close()
    return items
}

async function withoutBrowser(source) {
    const response = await Axios.get(source.url)
    const page = Cheerio.load(response.data)
    const items = page(source.selection).get().map(item => {
        if (!source.subselection) return Cheerio(item).text()
        const entries = Object.entries(source.subselection).map(([key, value]) => {
            const element = Cheerio.load(item)
            const valueContents = element(value).get().map(node => Cheerio(node).text())
            const valueContent = valueContents.length === 0 ? null
                : valueContents.length === 1 ? valueContents[0]
                : valueContents
            return [key, valueContent]
        })
        return Object.fromEntries(entries)
    })
    return items
}

async function run(source) {
    validate(source)
    const items = await (source.browser ? withBrowser : withoutBrowser)(source)
    return items
}

export default run
