import path from 'path'
import cors from 'cors'
import http from 'http'
import Boom from '@hapi/boom'
import bodyParser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import firebaseAdmin from 'firebase-admin';
import morgan from 'morgan';
import fs from 'fs'

import express, { Request, Response } from 'express'

import './models/index'

import adminRoutes
  from './routes/admin.routes'
import webhookRoutes
  from './routes/webhook.route'
import websiteRoutes
  from './routes/website.routes'
import customersRoutes
  from './routes/customers.routes'

import config
  from '../config'
import appConfig
  from './lib/appConfig'

import customerIoAuth
  from './middleware/customers.io.passport'

import { responseMessage }
  from './constants/message.constant'

import { allowedOrigins, fireStoreConfig }
  from './constants/app.constant'

import subscriptionService
  from './services/stripe/subscription'

const io = require('socket.io')();
const app = express()

morgan.token('body', (req) => JSON.stringify(req.body));

// Create a write stream (in append mode)
const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// Use morgan middleware to log requests and responses
app.use(morgan(':date[iso] :method :url :status :response-time ms - :res[content-length] :body', { stream: logStream }));

app.get('/logs', (req: Request, res: Response) => {
  fs.readFile(path.join(__dirname, 'access.log'), 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Unable to read log file');
    } else {
      res.send(`<pre>${data}</pre>`);
    }
  });
});

app.use(compression())

app.set(
  'views',
  path.join(__dirname, 'views')
)
app.set(
  'view engine',
  'html'
)

app.use(
  bodyParser.json({ limit: '1024mb' })
)
app.use(
  bodyParser.urlencoded({ extended: true })
)
app.use(
  cookieParser()
)

require('./scripts');
require('./cron');

io.use(customerIoAuth);
require('./socket')(io)

const appControllerResponse = responseMessage.appResponse

export const corsOptionsDelegate = async (req, callback) => {

  const grant = allowedOrigins[config.NODE_ENV]
    .indexOf(
      req.header('Origin')
    ) !== -1

  return grant
    ? callback(undefined, { origin: true })
    : callback(Boom.forbidden(appControllerResponse.corsError))
}

app.use(
  '/api/v1/webhook',
  cors(),
  webhookRoutes
)
app.use(
  '/api/v1/admin',
  cors(corsOptionsDelegate),
  adminRoutes
)
app.use(
  '/api/v1/website',
  cors(corsOptionsDelegate),
  websiteRoutes
)
app.use(
  '/api/v1/customers',
  cors(corsOptionsDelegate),
  customersRoutes
)

app.get(
  '/',
  async (req: Request, res: Response) =>
    res.sendFile(
      __dirname + '/views/index.html'
    )
)

app.set(
  'port',
  config.PORT
);

app.use(
  appConfig.handleError
)

const server = http.createServer(
  app
);

if (config.NODE_ENV !== 'test') {
  server.listen(
    config.PORT,
    () => console.log(
      `API listening on ${config.PORT}`
    )
  )
  io.attach(server);

  /** Create webhook */
  subscriptionService
    .createWebhook()
    .then(res => console.log(
      'Subscription webhook initiated succeed'
    ))

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(
      fireStoreConfig as any
    ),
  });
}

export {
  app,
  io
}
