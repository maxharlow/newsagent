import Zod from 'zod'
import Axios from 'axios'
import Cheerio from 'cheerio'
import Playwright from 'playwright'

function validate(settings) {
    const schema = Zod.object({
        url: Zod.string().url(),
        browser: Zod.string().regex(/chromium|webkit|firefox/).optional(),
        selection: Zod.string(),
        subselection: Zod.object().optional()
    })
    schema.parse(settings)
}

async function withBrowser(settings) {
    const browser = await Playwright[settings.browser].launch()
    const page = await browser.newPage()
    await page.goto(settings.url)
    await page.waitForSelector(settings.selection, { state: 'attached' })
    const items = await page.$$eval(settings.selection, (elements, subselection) => {
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
    }, settings.subselection)
    await browser.close()
    return items
}

async function withoutBrowser(settings) {
    const response = await Axios.get(settings.url)
    const page = Cheerio.load(response.data)
    const items = page(settings.selection).get().map(item => {
        if (!settings.subselection) return Cheerio(item).text()
        const entries = Object.entries(settings.subselection).map(([key, value]) => {
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

async function run(settings) {
    validate(settings)
    const items = await (settings.browser ? withBrowser : withoutBrowser)(settings)
    return items
}

export default run
