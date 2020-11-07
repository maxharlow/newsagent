import WorkerThreads from 'worker_threads'
import Zod from 'zod'
import Nodemailer from 'nodemailer'

function validate(source) {
    const schema = Zod.object({
        name: Zod.string(),
        settings: Zod.object({
            method: Zod.string().regex(/email/),
            to: Zod.string().email(),
            smtpHost: Zod.string(),
            smtpUsername: Zod.string(),
            smtpPassword: Zod.string()
        }),
        item: Zod.object({
            id: Zod.string(),
            difference: Zod.string().regex(/addition|removal/),
            content: Zod.union([Zod.string(), Zod.object()])
        })
    })
    schema.parse(source)
}

async function run(name, settings, item) {
    validate({ name, settings, item })
    const transporter = Nodemailer.createTransport({
        host: settings.smtpHost,
        auth: {
            user: settings.smtpUsername,
            pass: settings.smtpPassword
        }
    })
    const info = await transporter.sendMail({
        from: 'Newsagent',
        to: settings.to,
        subject: `Newsagent alert: ${name}`,
        text: `${item.difference.toUpperCase()}\n\n${JSON.stringify(item.content)}`
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
