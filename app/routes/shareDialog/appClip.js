import Router from 'express'
import { SharedRoute } from '../../db/index.js'
import { parseStringPromise, Builder } from 'xml2js'
import { query, body, validationResult } from 'express-validator'
import fs from 'fs'
import sharp from 'sharp'
import { promisify } from 'util';
import config from 'config'

const router = Router()

async function createAppClip(options) {
    const { id, background, primary, secondary, logo, useBadge, badgeTextColor } = options

    const svg = await promisify(fs.readFile)(`appClipsTemplates/a${id}.svg`, 'utf8')

    const res = await parseStringPromise(svg)
    res.svg.circle[0].$.style = `fill:#${background}`
    res.svg.g[0].g.forEach(g => {
        g.path.forEach(path => {
            path.$.style = path.$.style
                .replace('stroke:#000000', `stroke:#${primary}`)
                .replace('stroke:#888888', `stroke:#${secondary}`)
        })
    })

    if (logo != 'camera') {
        const logoStr = await promisify(fs.readFile)(`appClipsTemplates/logo_${logo}.svg`, 'utf8')
        const logoSvg = await parseStringPromise(logoStr)
        res.svg.g[1] = logoSvg.g
    }

    res.svg.g[1].path.forEach(path => {
        path.$.style = path.$.style
            .replace('#000000', `#${primary}`)
            .replace('#888888', `#${secondary}`)
    })


    if (useBadge) {
        res.svg.$.viewBox = "-50 -50 900 1100"
        res.svg.circle[0].$.transform = 'translate(-0.99 -3.8)'

        const lockupStr = await promisify(fs.readFile)(`appClipsTemplates/lockup.svg`, 'utf8')
        const lockupSvg = await parseStringPromise(lockupStr)

        lockupSvg.g.path[0].$.style = lockupSvg.g.path[0].$.style.replace('#000000', `#${background}`)
        lockupSvg.g.g[0].$.style = lockupSvg.g.g[0].$.style.replace('#000000', `#${badgeTextColor}`)

        const params = res.svg.g[1].$.transform.split(' ')
        const x = Number.parseFloat(params.shift().split('(')[1])
        const y = Number.parseFloat(params.shift())

        res.svg.g[1].$.transform = `translate(${x - 0.99} ${y - 3.8}) ${params.join(' ')}`

        res.svg = {
            $: res.svg.$,
            title: res.svg.title,
            g: [lockupSvg, {
                circle: res.svg.circle,
                g: res.svg.g
            }],
        }
    }

    var builder = new Builder();
    var xml = builder.buildObject(res)

    return xml
}

function checkAppClipExist(id) {
    return fs.existsSync(`appClipsTemplates/a${id}.svg`)
}

async function calculateAppClips() {
    return (await SharedRoute.aggregate([
        {
            $match: {
                codeType: 'appclip'
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

async function status() {
    const count = await calculateAppClips()
    const exist = checkAppClipExist((count + 1) || 1)

    return exist
}

router.get('/appclip-code',
    query('id').isNumeric(),
    query('background').isHexColor().optional({ nullable: true }),
    query('primary').isHexColor().optional({ nullable: true }),
    query('secondary').isHexColor().optional({ nullable: true }),
    query('badgeTextColor').isHexColor().optional({ nullable: true }),
    query('logo').isIn(['camera', 'phone']).optional({ nullable: true }),
    query('useBadge').isBoolean().toBoolean().optional({ nullable: true }),
    query('width').isInt({ min: 32, max: 2048 }).toInt().optional({ nullable: true }),
    query('type').isIn(['svg', 'png']).optional({ nullable: true }),
    async (req, res) => {
        const q = req.query

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!checkAppClipExist(q.id)) {
            return res.status(400).json({ error: 'appclip_not_found' })
        }

        let params = {
            id: q.id,
            background: q.background || 'ffffff',
            primary: q.primary || '000000',
            secondary: q.secondary || '888888',
            badgeTextColor: q.badgeTextColor || '000000',
            logo: q.logo || 'camera',
            useBadge: q.useBadge || false,
        }


        const svg = await createAppClip(params)

        if (q.type == 'svg') {
            res.attachment('appclip.svg')
            res.type('svg')
            res.send(svg)
        } else {
            const png = await sharp(Buffer.from(svg))
                .resize({ width: q.width || 1024 })
                .png()
                .toBuffer()
            res.attachment('appclip.png')
            res.type('image/png')
            res.send(png)
        }
    })

async function generateAppClip(params) {
    const { from, to, helloText, asphalt, serviceRoute, allowParameterChange } = params

    const codeID = await calculateAppClips() + 1 || 1

    if (!checkAppClipExist(codeID)) {
        throw 'appclip_not_found';
    }

    const sharedRoute = new SharedRoute({
        from: from,
        to: to,
        helloText: helloText || "",
        codeType: 'appclip',
        codeID: codeID,
        asphalt: asphalt || false,
        serviceRoute: serviceRoute || false,
        allowParameterChange: allowParameterChange || false,
    })

    await sharedRoute.save()

    return {
        codeID: `${codeID}`,
        base: config.get('baseUrl'),
        codeUrl: `${config.get('baseUrl')}/l/a${codeID}`
    }
}

export default { router, status, generateAppClip }
