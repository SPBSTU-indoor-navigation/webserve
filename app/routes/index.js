import Router from 'express'
import shareDialog from './shareDialog/index.js'


const router = Router()

router.use('/api', shareDialog)

router.get('/api', (req, res) => {
    res.json(
        {
            status: 'online',
            env: process.env.NODE_ENV
        }
    )
})

router.get('/.well-known/apple-app-site-association', (req, res) => {
    res.json(
        {
            applinks: {
                apps: [],
                details: [
                    {
                        appID: 'LZP5UN7552.com.soprachev.polymap',
                        components: [
                            {
                                '/': '/l/*'
                            },
                            {
                                '/': '/share/route',
                                '?': {
                                    'from': '?*',
                                    'to': '?*'
                                }
                            },
                            {
                                '/': '/share/annotation',
                                '?': { 'annotation': '*' }
                            }
                        ],
                    }
                ]
            },
            appclips: {
                apps: [
                    "LZP5UN7552.com.soprachev.polymap.clip",
                    "LZP5UN7552.com.soprachev.polymap"
                ]
            }
        }
    )
})

export default router
