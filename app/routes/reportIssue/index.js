import Router from 'express'
import { ReportIssueAnnotation, ReportIssueRoute } from '../../db/index.js'

const router = Router()

router.post('/route', async (req, res) => {
    const { message, to, from, asphalt, serviceRoute } = req.body

    const report = new ReportIssueRoute({
        description: message,
        route: {
            from: from,
            to: to,
            params: {
                asphalt: asphalt,
                serviceRoute: serviceRoute,
            }
        },
    })

    await report.save()

    res.json({ "status": "ok" })
})

router.post('/annotation', async (req, res) => {
    const { annotation, message } = req.body

    const report = new ReportIssueAnnotation({
        description: message,
        annotation: annotation,
    })

    await report.save()

    res.json({ "status": "ok" })
})

export default router
