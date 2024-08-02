import { SubscriptionsModel } from '../../../models/index'

/** Create Subscription */
const createSubscription = async (body: any) => {
      try {
            body.status = 'Active'
            const result: any = await SubscriptionsModel.create(body)
            result.status = result.status === 'Active';
            return result.toJSON()
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Modify Subscription */
const updateSubscription = async (body: any, id: string) => {
      try {
            if (body.status === true) body.status = 'Active'
            if (body.status === false) body.status = 'Deactive'
            const updatedSubscription: any = await SubscriptionsModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            updatedSubscription.status = updatedSubscription.status === 'Active';
            return updatedSubscription
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one Subscription by filter */
const getOneSubscriptionByFilter = async (query: any) => {
      try {
            const result: any = await SubscriptionsModel.findOne(query).lean()
            if (result) {
                  result.status = result.status === 'Active';
            }
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Subscriptions for table */
const getAllSubscriptions = async (skip: number, limit, search: object, sort) => {
      try {
            const subscriptionsList: any = await SubscriptionsModel.find(search).select('-stripePlanId').skip(skip).limit(limit).sort(sort).lean()
            subscriptionsList.forEach(item => {
                  item.status = item.status === 'Active';
            })
            const count = await SubscriptionsModel.find(search).countDocuments()
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
      deleteSubscription,
}
