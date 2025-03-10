import express, { Router } from 'express'
import {
    createDonation
} from '../../controllers/customers/donation.controller'

const router: Router = express.Router()

router.post('/', createDonation)

export default router