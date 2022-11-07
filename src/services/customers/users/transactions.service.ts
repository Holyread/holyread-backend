import { TransactionsModel, createTransationsType } from '../../../models/transactions.model'
import { InAppNotificationModel, createInAppNotificationType } from '../../../models/inAppNotification.model'

/** Create transaction */
const createTransaction = async (body: createTransationsType) => {
      try {
            await TransactionsModel.create(body)
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Create transaction */
const createAppTransaction = async (body: createInAppNotificationType) => {
      try {
            await InAppNotificationModel.create(body)
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
      deleteTransaction,
      createAppTransaction
}
