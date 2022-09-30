import { TransactionsModel, createTransationsType } from '../../../models/transactions.model'

/** Create transaction */
const createTransaction = async (body: createTransationsType) => {
      try {
            await TransactionsModel.create(body)
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createTransaction
}
