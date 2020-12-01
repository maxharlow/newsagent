import Process from 'process'
import Util from 'util'
import Yargs from 'yargs'
import FSExtra from 'fs-extra'
import Yaml from 'yaml'
import Chalk from 'chalk'
import newsagent from './newsagent.js'

async function display(watches) {
    console.error(`\n${Chalk.bold('Watching:')}\n`)
    watches.forEach(watch => {
        console.error(`  ${Chalk.green(watch.name)}`)
    })
    console.error(`\n${Chalk.bold('Logs:')}\n`)
    const message = (source, event, data) => {
        const timestamp = new Date().toISOString()
        console.log(`${Chalk.grey(timestamp)} ${Chalk.yellow(source || '(unknown)')} ${event}`, data ? Util.inspect(data, { depth: Infinity }) : '')
    }
    try {
        await newsagent(watches, message)
    }
    catch (e) {
        console.error(`Could not start: ${e.message}`)
    }
}

async function setup() {
    const instructions = Yargs(Process.argv.slice(2))
        .usage('Usage: newsagent <watchfiles...>')
        .wrap(null)
        .help('?').alias('?', 'help')
        .version().alias('v', 'version')
        .demandCommand(1, '')
    try {
        const { _: watchfiles } = instructions.argv
        const parsing = watchfiles.flatMap(async file => {
            const data = await FSExtra.readFile(file, 'utf8')
            return Yaml.parse(data)
        })
        const watches = await Promise.all(parsing)
        await display(watches)
    }
    catch (e) {
        console.error(e.message)
        Process.exit(1)
    }
}

setup()
