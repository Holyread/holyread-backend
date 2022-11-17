
import express, { Router } from 'express'
import {
      createTransaction,
      createAppTransaction,
      createGoogleTransaction
} from '../controllers/customers/transaction.controller'

const router: Router = express.Router()

/** Subscription transation webhook route */
router.post('/transactions', createTransaction);
router.post('/app-pay-transactions', createAppTransaction);
router.post('/google-pay-transactions', createGoogleTransaction);

export default router
