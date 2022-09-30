
import express, { Router } from 'express'
import { createTransaction } from '../controllers/customers/transaction.controller'

const router: Router = express.Router()

/** Subscription transation webhook route */
router.post('/transactions', createTransaction);

export default router
