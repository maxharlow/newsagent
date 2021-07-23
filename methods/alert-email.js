import WorkerThreads from 'worker_threads'
import * as Zod from 'zod'
import Nodemailer from 'nodemailer'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        content: Zod.union([Zod.string(), Zod.object({}), Zod.array(Zod.string())]),
        settings: Zod.object({
            to: Zod.string().email(),
            smtpHost: Zod.string(),
            smtpUsername: Zod.string(),
            smtpPassword: Zod.string()
        })
    })
    schema.parse(source)
}

async function run(name, content, settings) {
    validate({ name, content, settings })
    const transporter = Nodemailer.createTransport({
        host: settings.smtpHost,
        auth: {
            user: settings.smtpUsername,
            pass: settings.smtpPassword
        }
    })
    const body = JSON.stringify(content)
    const info = await transporter.sendMail({
        from: 'Newsagent',
        to: settings.to,
        subject: `Newsagent alert: ${name}`,
        text: body
    })
    WorkerThreads.parentPort.postMessage({
        event: 'alert-email-sent',
        data: {
            to: settings.to,
            response: info.response
        }
    })
}

export default run
