import express from 'express'
import cors from 'cors'
import config from 'config'

import routes from './routes/index.js'

const app = express()

app.use(express.json())
app.use(cors());
app.options('*', cors());

app.use('/', routes)

async function Start() {
    const port = config.get('appPort') || 5000
    try {
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
