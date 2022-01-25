import express, { Router } from 'express'
import cors from 'cors'

import auth from './customers/auth.route'
import users from './customers/users.route'
import { corsOptionsDelegate } from '../app'

const router: Router = express.Router()

router.use('/auth', cors(corsOptionsDelegate), auth)
router.use('/users', users)

export default router
