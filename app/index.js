import express from 'express'
import cors from 'cors'
import config from 'config'
import mongoose from 'mongoose'
import { bot } from './telegrambot/indes.js'

import routes from './routes/index.js'

const app = express()

app.use(express.json())
app.use(cors());
app.options('*', cors());

app.use('/', routes)

async function Start() {
    const port = config.get('appPort') || 5000
    try {
        await mongoose.connect(config.get('mongo-URL-serve'))

        app.listen(port, () => {
            console.log(`App listening at http://localhost:${port}`)
        })
    }
    catch (e) {
        console.error(`Server error: ${e.message}`)
        process.exit(1)
    }
}

Start()
