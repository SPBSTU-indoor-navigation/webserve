import Router from 'express'
import appClip from './appClip.js'
import qr from './qrCode.js'
import appDB from '../../db/index.js'
import { body, validationResult, param } from 'express-validator'

const SharedRoute = appDB.model('sharedRoute')
const router = Router()

router.use('/', appClip.router)
router.use('/', qr.router)

router.get('/generator/status', async (req, res) => {
    res.json({
        status: 'online',
        appclip: await appClip.status(),
        qr: true
    })
})

router.post('/generate',
    body('from').isUUID(),
    body('to').isUUID(),
    body('helloText').isString().isLength({ max: 5000 }).optional({ nullable: true }),
    body('codeVariant').isIn(['qr', 'appclip']),
    body('asphalt').isBoolean().toBoolean().optional({ nullable: true }),
    body('serviceRoute').isBoolean().toBoolean().optional({ nullable: true }),
    body('allowParameterChange').isBoolean().toBoolean().optional({ nullable: true }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { codeVariant } = req.body

        if (codeVariant == 'appclip') {
            appClip.generateAppClip(req.body)
                .then(t => {
                    return res.json(t)
                }).catch(e => {
                    return res.status(400).json({ error: e })
                })
        } else {
            qr.generateQR(req.body)
                .then(t => {
                    return res.json(t)
                }).catch(e => {
                    return res.status(400).json({ error: e })
                })
        }
    })

router.get('/load/:id', param('id').exists().isLength({ min: 2 }), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const arr = req.params.id.split('');
    const fistChar = arr.shift();
    const id = arr.join('');

    var route = null

    if (fistChar == 'a') {
        route = await SharedRoute.findOne({ codeType: 'appclip', codeID: id })
    } else if (fistChar == 'q') {
        route = await SharedRoute.findOne({ codeType: 'qr', codeID: id })
    } else {
        return res.status(400).json({ error: 'wrong first char' });
    }

    if (!route) {
        return res.status(400).json({ error: 'route not found' })
    }

    return res.json({
        from: route.from,
        to: route.to,
        helloText: route.helloText,
        asphalt: route.asphalt,
        serviceRoute: route.serviceRoute,
        allowParameterChange: route.allowParameterChange
    })
})

export default router
