import { SubscriptionsModel } from '../../../models/index'

/** Get all Subscriptions for table */
const getAllSubscriptions = async (search) => {
      try {
            const subscriptions: any = await SubscriptionsModel.find(search).lean().exec()
            subscriptions.sort((a,b) => Number(a.price) - Number(b.price))
            return subscriptions
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllSubscriptions
}
