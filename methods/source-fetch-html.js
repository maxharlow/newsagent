import * as Zod from 'zod'
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
    const [selector, selectorAttribute] = settings.selection.split(' | ')
    await page.waitForSelector(selector, { state: 'attached' })
    const passthrough = {
        selectorAttribute,
        subselection: settings.subselection
    }
    const items = await page.$$eval(selector, (elements, passthrough) => {
        return elements.map(element => {
            if (!passthrough.subselection) return passthrough.selectorAttribute ? element[passthrough.selectorAttribute] : element.textContent
            const entries = Object.entries(passthrough.subselection).map(([key, subselection]) => {
                const [subselector, subselectorAttribute] = subselection.split(' | ')
                const contents = Array.from(element.querySelectorAll(subselector)).map(node => subselectorAttribute ? node[subselectorAttribute] : node.textContent)
                const content = contents.length === 0 ? null
                    : contents.length === 1 ? contents[0]
                    : contents
                return [key, content]
            })
            return Object.fromEntries(entries)
        })
    }, passthrough)
    await browser.close()
    return items
}

async function withoutBrowser(settings) {
    const response = await Axios.get(settings.url)
    const page = Cheerio.load(response.data)
    const [selector, selectorAttribute] = settings.selection.split(' | ')
    const items = page(selector).get().map(item => {
        if (!settings.subselection) return selectorAttribute ? Cheerio(item).attr(selectorAttribute) : Cheerio(item).text()
        const entries = Object.entries(settings.subselection).map(([key, subselection]) => {
            const [subselector, subselectorAttribute] = subselection.split(' | ')
            const element = Cheerio.load(item)
            const contents = element(subselector).get().map(node => subselectorAttribute ? Cheerio(node).attr(subselectorAttribute) : Cheerio(node).text())
            const content = contents.length === 0 ? null
                : contents.length === 1 ? contents[0]
                : contents
            return [key, content]
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
