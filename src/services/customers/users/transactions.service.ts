import { TransactionsModel, createTransationsType } from '../../../models/transactions.model'

/** Create transaction */
const createTransaction = async (body: createTransationsType) => {
      try {
            await TransactionsModel.create(body)
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Delete user transactions */
const deleteTransaction = async (query: Object) => {
      try {
            await TransactionsModel.deleteMany(query)
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createTransaction,
      deleteTransaction
}
