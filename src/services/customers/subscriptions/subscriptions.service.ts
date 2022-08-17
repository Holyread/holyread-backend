import { SubscriptionsModel } from '../../../models/index'

/** Get all Subscriptions for table */
const getAllSubscriptions = async (search) => {
      try {
            const subscriptions: any = await SubscriptionsModel.find(search).lean().exec()
            const defaultSubscription = subscriptions.find(item => item.duration === 'Month')
            subscriptions.forEach(item => {
                  let oneMonthPrice = item.price
                  if (item.duration === 'Half – Year') oneMonthPrice = item.price / 6
                  if (item.duration === 'Year') oneMonthPrice = item.price / 12
                  item.save = ((defaultSubscription.price - oneMonthPrice)/defaultSubscription.price * 100).toFixed(0)
            })
            subscriptions.sort((a,b) => Number(a.price) - Number(b.price))
            return subscriptions
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllSubscriptions
}
