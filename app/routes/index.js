import Router from 'express'

const router = Router()

router.get('/', (req, res) => {
    res.json(
        {
            status: 'online',
            env: process.env.NODE_ENV
        }
    )
})

export default router
