import Router from 'express'
import appDB from '../../db/index.js'
import config from 'config'
import sharp from 'sharp'
import { query, validationResult } from 'express-validator'

import { parseStringPromise, Builder } from 'xml2js'
import { promisify } from 'util';
import fs from 'fs'
import path from 'path'

import { QRCodeStyling } from '../../../qr-code-styling/lib/qr-code-styling.common.js'
import { JSDOM } from 'jsdom'

const SharedRoute = appDB.model('sharedRoute')
const router = Router()

async function createQR(options) {
    const { url, background, primary, logo } = options

    const config = {
        width: 256,
        height: 256,
        data: url,
        dotsOptions: {
            color: `#${primary}`,
            type: "rounded"
        },
        backgroundOptions: {
            color: `#${background}`,
        },
        cornersSquareOptions: {
            type: "extra-rounded"
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 8,
            imageSize: 0.5
        }
    }

    if (logo) {
        config.image = `file://${path.resolve('./logoTemplate/icon.svg')}`
    }

    const qrCodeSvg = new QRCodeStyling({
        jsdom: JSDOM,
        type: "svg",
        ...config
    });

    const svg = String(await qrCodeSvg.getRawData("svg"))
    const res = await parseStringPromise(svg)

    if (logo) {
        const params = res.svg.image[0].$
        const logoSvg = await parseStringPromise(await promisify(fs.readFile)(`logoTemplate/icon.svg`, 'utf8'))

        res.svg.image = undefined

        logoSvg.svg.$.width = params.width
        logoSvg.svg.$.height = params.height
        logoSvg.svg.$.x = params.x
        logoSvg.svg.$.y = params.y

        logoSvg.svg.path[0].$.fill = `#${primary}`

        res.svg.rect[0].$.rx = 25

        res.svg = {
            ...res.svg,
            g: [logoSvg]
        }
    }

    var builder = new Builder();
    var xml = builder.buildObject(res)

    return xml
}

router.get('/qr-code',
    query('id').isNumeric(),
    query('background').isHexColor().optional({ nullable: true }),
    query('primary').isHexColor().optional({ nullable: true }),
    query('logo').isBoolean().toBoolean().optional({ nullable: true }),
    query('width').isInt({ min: 32, max: 2048 }).toInt().optional({ nullable: true }),
    query('type').isIn(['svg', 'png']).optional({ nullable: true }),
    async (req, res) => {
        const q = req.query

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const svg = await createQR({
            url: `${config.get('baseUrl')}/l/q${q.id}`,
            background: q.background || 'ffffff',
            primary: q.primary || '000000',
            logo: q.logo != undefined ? q.logo : true
        })

        if (q.type == 'svg') {
            res.attachment('qr.svg')
            res.type('svg')
            res.send(svg)
        } else {
            const png = await sharp(Buffer.from(svg))
                .resize({ width: q.width || 1024 })
                .png()
                .toBuffer()
            res.attachment('qr.png')
            res.type('image/png')
            res.send(png)
        }
    })

async function calculateIndex() {
    return (await SharedRoute.aggregate([
        {
            $match: {
                codeType: 'qr'
            }
        }, {
            $group: {
                _id: null,
                count: {
                    $sum: 1
                }
            }
        }
    ]))[0]?.count || 0
}

async function generateQR(params) {
    const { from, to, helloText, asphalt, serviceRoute, allowParameterChange } = params

    const codeID = await calculateIndex() + 1

    const sharedRoute = new SharedRoute({
        from: from,
        to: to,
        helloText: helloText || "",
        codeType: 'qr',
        codeID: codeID,
        asphalt: asphalt || false,
        serviceRoute: serviceRoute || false,
        allowParameterChange: allowParameterChange || false,
    })

    await sharedRoute.save()

    return {
        codeID: `${codeID}`,
        base: config.get('baseUrl'),
        codeUrl: `${config.get('baseUrl')}/l/q${codeID}`
    }
}

export default { router, generateQR }
