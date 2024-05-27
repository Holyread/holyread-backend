import express, { Router } from 'express'
import { getAllTransactions, getOneTransaction } from '../../controllers/admin/transactions.controller'

const router: Router = express.Router()

router.get('/', getAllTransactions)
router.get('/:id', getOneTransaction)

export default router
