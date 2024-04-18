import express, { Router } from 'express'
import {
    getOneDailyDevotional
} from '../../../controllers/customers/book/dailyDevotional.controller';

const router: Router = express.Router()

router.get('/:id', getOneDailyDevotional)

export default router
