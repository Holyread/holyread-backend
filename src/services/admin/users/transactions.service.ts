import { TransactionsModel } from '../../../models/transactions.model'

/** Get transaction by filter */
const getAllTransactions = async (skip: number, limit: number, search: any, sort, library?: any) => {
      try {
            let result: any = await TransactionsModel.find(search).select('planCreatedAt planExpiredAt userId total status paymentMethod reason paymentLink createdAt').populate('userId', 'email').skip(skip).limit(limit).sort(sort).lean().exec()
            let count: any = await TransactionsModel.count(search).lean().exec()
            return { count, transactions: result }
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllTransactions
}
