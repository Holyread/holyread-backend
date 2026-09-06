import path from 'path'
import cors from 'cors'
import http from 'http'
import Boom from '@hapi/boom'
import bodyParser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import firebaseAdmin from 'firebase-admin';

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
  bodyParser.json({ limit: '2048mb' }) // 2GB limit for JSON payload
);
app.use(
  bodyParser.urlencoded({ extended: true, limit: '2048mb' }) // 2GB limit for URL-encoded payload
);

app.use(
  cookieParser()
)

if (config.RUN_STARTUP_SCRIPTS) {
  require('./scripts');
} else {
  console.log(
    'Startup migrations skipped (RUN_STARTUP_SCRIPTS off)'
  )
}

if (config.RUN_CRON) {
  require('./cron');
} else {
  console.log(
    'Cron scheduler skipped (RUN_CRON off)'
  )
}

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

  /**
   * Firebase service-account credentials come from the environment
   * (FIREBASE_* vars). Missing credentials are fatal in a deployed
   * environment so a misconfigured release fails its health check and rolls
   * back, rather than starting up with push notifications silently broken.
   * Locally we only warn, so the server still runs without a Firebase key.
   */
  if (fireStoreConfig.private_key && fireStoreConfig.client_email) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(
        fireStoreConfig as any
      ),
    });
  } else if (config.NODE_ENV === 'local') {
    console.warn(
      'FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL not set — '
      + 'skipping Firebase init. Push notifications are disabled.'
    )
  } else {
    throw new Error(
      'Firebase service-account credentials are missing. Set '
      + 'FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_ID, FIREBASE_PRIVATE_KEY, '
      + 'FIREBASE_CLIENT_EMAIL and FIREBASE_CLIENT_ID in the environment.'
    )
  }
}

export {
  app,
  io
}
