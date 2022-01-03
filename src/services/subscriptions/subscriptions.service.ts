import { SubscriptionsModel } from '../../models/index'

/** Create Subscription */
const createSubscription = async (body: any) => {
      try {
            const result = await SubscriptionsModel.create(body)
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Modify Subscription */
const updateSubscription = async (body: any, id: string) => {
      try {
            const updatedSubscription = await SubscriptionsModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            return updatedSubscription
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one Subscription by filter */
const getOneSubscriptionByFilter = async (query: any) => {
      try {
            const result = await SubscriptionsModel.findOne(query).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Subscriptions for table */
const getAllSubscriptions = async (skip: number, limit, search: object, sort) => {
      try {
            const subscriptionsList = await SubscriptionsModel.find(search).skip(skip).limit(limit).sort(sort)
            const count = await SubscriptionsModel.find(search).count()
            return { count, subscriptions: subscriptionsList }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Subscriptions name */
const getAllSubscriptionsName = async () => {
      try {
            const subscriptionsList = await SubscriptionsModel.find({}).select('title')
            return subscriptionsList
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove Subscription */
const deleteSubscription = async (id: string) => {
      try {
            await SubscriptionsModel.findOneAndDelete({ _id: id })
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createSubscription,
      updateSubscription,
      getOneSubscriptionByFilter,
      getAllSubscriptions,
      getAllSubscriptionsName,
      deleteSubscription
}
