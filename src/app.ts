import express, { Request, Response } from 'express'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import path from 'path'
import cors from 'cors'
import Boom from '@hapi/boom'

import customersRoutes from './routes/customers.routes'
import adminRoutes from './routes/admin.routes'

import appConfig from './lib/appConfig'
import './models/index'
import config from '../config'
import { allowedOrigins } from './constants/app.constant'
import { responseMessage } from './constants/message.constant'

const app = express()
app.use(compression())

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html')

app.use(bodyParser.json({ limit: '500mb' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

require('./scripts')

const appControllerResponse = responseMessage.appResponse

const corsOptionsDelegate = async (req, callback) => {
  return allowedOrigins[config.NODE_ENV].indexOf(req.header('Origin')) === -1
      ? callback(Boom.forbidden(appControllerResponse.corsError))
      : callback(undefined, { origin: true })
}

app.use('/api/v1/customers', cors(corsOptionsDelegate), customersRoutes)
app.use('/api/v1/admin', cors(corsOptionsDelegate), adminRoutes)
app.get('/', async (req: Request, res: Response) => res.sendFile(__dirname + '/views/index.html'))
app.use(appConfig.handleError)

if (config.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => console.log(`API listening on ${config.PORT}`))
}

export {
  app
}