import { SubscriptionsModel } from '../../../models/index'
import stripeSubscriptionService from '../../stripe/subscription';

/** Get all Subscriptions for table */
const getAllSubscriptions = async (search) => {
      try {
            const subscriptions: any = await SubscriptionsModel.find(search).sort({ createdAt: -1 }).limit(2).lean().exec()
            subscriptions.sort((a, b) => Number(a.price) - Number(b.price))
            return subscriptions
      } catch (e: any) {
            throw new Error(e)
      }
}

const getUserSubscriptionStatus = async (user) => {
      try {
            let subscriptionStatus;
            let isPlanActive = false
            let isPlanExpired = false
            if (
                  user.inAppSubscription &&
                  [
                        'active',
                        'subscribed',
                        'did_renew',
                        'offer_redeemed',
                  ].includes(
                        user?.inAppSubscriptionStatus?.toLowerCase()
                  )
            ) {
                  isPlanActive = true
                  // todo: count duration with createdAt
                  // if duration already ended
                  // then mark plan as inactive
            } else if (
                  user.inAppSubscription &&
                  ![
                        'active',
                        'subscribed',
                        'did_renew',
                        'offer_redeemed',
                  ].includes(
                        user?.inAppSubscriptionStatus?.toLowerCase()
                  )
            ) {
                  isPlanExpired = true
            }

            if (!isPlanActive && user?.stripe?.subscriptionId) {
                  try {
                        const s = await stripeSubscriptionService
                              .retrieveSubscription(
                                    user.stripe.subscriptionId
                              )
                        isPlanActive = s?.status === 'active'
                        isPlanExpired = !['active', 'trialing'].includes(s?.status?.toLowerCase())
                  } catch (e) { console.log(e) }
            }

            if (!isPlanActive || isPlanExpired) {
                  subscriptionStatus = 'freemium'
                  return subscriptionStatus
            } else {
                  subscriptionStatus = 'premium'
                  return subscriptionStatus
            }
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllSubscriptions,
      getUserSubscriptionStatus,
}
