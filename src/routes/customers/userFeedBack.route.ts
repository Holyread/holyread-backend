import express, { Router } from 'express'
import {
    submitFeedback
} from '../../controllers/customers/feedBackController'

const router: Router = express.Router()

router.post('/', submitFeedback)

export default router
