import Process from 'process'
import FSExtra from 'fs-extra'
import Bree from 'bree'
import Zod from 'zod'

function validate(watches) {
    const schema = Zod.array(
        Zod.object({
            name: Zod.string(),
            source: Zod.object({ method: Zod.string() }).nonstrict(),
            schedule: Zod.string(),
            monitor: Zod.string().regex(/additions-only|additions-and-removals|removals-only/),
            processes: Zod.array(Zod.object({ method: Zod.string() }).nonstrict()).optional(),
            alerts: Zod.array(Zod.object({ method: Zod.string() }).nonstrict())
        })
    )
    return schema.parse(watches)
}

async function generate(watch, i) {
    const executor = await FSExtra.readFile('executor.js')
    const id = watch.name.toLowerCase().replace(/[^a-z ]+/g, '').replace(/ /g, '-')
    const code = `const watch = ${JSON.stringify(watch)}; ` + executor
    const path = `./.newsagent-jobs/job-${i + 1}-${id}.js`
    await FSExtra.writeFile(path, code)
    return path
}

async function run(watches, message = () => {}) {
    validate(watches)
    await FSExtra.remove('.newsagent-jobs')
    await FSExtra.ensureDir('.newsagent-jobs')
    await FSExtra.ensureDir('.newsagent-cache')
    Process.on('SIGINT', async () => {
        await FSExtra.remove('.newsagent-jobs')
        process.exit()
    })
    const jobsGeneration = watches.map(async (watch, i) => {
        return {
            name: watch.name,
            path: await generate(watch, i),
            interval: watch.schedule
        }
    })
    const logger = {
        info: (text, metadata) => {
            if (text.startsWith('Worker for job') && text.endsWith('online')) {
                const source = text.split('"')[1]
                message(source, 'worker-starting')
            }
            else if (text.startsWith('Worker for job') && text.endsWith('exited with code 0')) {
                const source = text.split('"')[1]
                message(source, 'worker-finished')
            }
            else if (text.startsWith('Worker for job') && text.endsWith('sent a message')) {
                const source = text.split('"')[1]
                message(source, metadata.message.event, metadata.message.data)
            }
            else message(null, 'INFO', { text, metadata })
        },
        warn: (e, metadata) => {
            if (e.message.startsWith('Job') && e.message.endsWith('is already running')) {
                const source = e.message.split('"')[1]
                message(source, 'already-running')
            }
            else message(null, 'WARN', { text: e.message, metadata })
        },
        error: (e, metadata) => {
            message(null, 'ERROR', { text: e.message, metadata })
        }
    }
    const jobs = await Promise.all(jobsGeneration)
    new Bree({
        root: false,
        logger,
        jobs
    }).start()
}

export default run
