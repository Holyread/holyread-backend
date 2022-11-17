import express, { Router } from 'express'
import { getAllTransactions } from '../../controllers/admin/transactions.controller'

const router: Router = express.Router()

router.get('/', getAllTransactions)

export default router
