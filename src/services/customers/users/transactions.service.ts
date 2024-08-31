import { TransactionsModel, createTransationsType } from '../../../models/transactions.model'
import { IInAppNotification, InAppNotificationModel, createInAppNotificationType } from '../../../models/inAppNotification.model'
import { FilterQuery } from 'mongoose'

/** Create transaction */
const createTransaction = async (body: createTransationsType) => {
      try {
            return await TransactionsModel.create(body)
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Create transaction */
const createAppTransaction = async (body: createInAppNotificationType) => {
      try {
            return await InAppNotificationModel.create(body)
      } catch (e: any) {
            throw new Error(e)
      }
}
const updateAppTransaction = async (query: FilterQuery<IInAppNotification>, body: createInAppNotificationType) => {
      try {
            return await InAppNotificationModel.findOneAndUpdate(query, body)
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Delete user transactions */
const deleteTransaction = async (query: any) => {
      try {
            await TransactionsModel.deleteMany(query)
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createTransaction,
      deleteTransaction,
      createAppTransaction,
      updateAppTransaction,
}
