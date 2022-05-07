import Router from 'express'
import { ReportIssueAnnotation, ReportIssueRoute } from '../../db/index.js'
import { sendIssue } from '../../telegrambot/indes.js'

const router = Router()

function deviceInfo(body) {
    const { locale, modelCode, orientation, os, appVersion, screen } = body
    return `${modelCode};\t${os};\t${appVersion}${locale}\n${screen}; ${orientation}`
}

router.post('/route', async (req, res) => {
    const { message, to, from, asphalt, serviceRoute, locale, modelCode, orientation, os, appVersion, screen } = req.body

    const report = new ReportIssueRoute({
        description: message,
        device: {
            locale, modelCode, orientation, os, appVersion, screen
        },
        route: {
            from: from,
            to: to,
            params: {
                asphalt: asphalt,
                serviceRoute: serviceRoute,
            }
        },
        date: new Date()
    })

    await report.save()

    sendIssue(`*⏤⏤⏤⏤route issue⏤⏤⏤⏤*
*Сообщение:* ${message}
*Асфальт:* ${asphalt}
*Служебный маршрут:* ${serviceRoute}

⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤
*URL:* https://polymap.ru/share/route?from=${from}&to=${to}&asphalt=${asphalt}&serviceRoute=${serviceRoute}
⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤
${deviceInfo(req.body)}`)

    res.json({ "status": "ok" })
})

router.post('/annotation', async (req, res) => {
    const { annotation, message, locale, modelCode, orientation, os, appVersion, screen } = req.body

    const report = new ReportIssueAnnotation({
        description: message,
        annotation: annotation,
        device: {
            locale, modelCode, orientation, os, appVersion, screen
        },
        date: new Date()
    })

    await report.save()


    sendIssue(`*⏤⏤⏤annotation issue⏤⏤⏤*
*Сообщение:* ${message}

⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤
*URL:* https://polymap.ru/share/annotation?annotation=${annotation}
⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤
${deviceInfo(req.body)}`)

    res.json({ "status": "ok" })
})

export default router
