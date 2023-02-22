import { UserModel } from '../models';
import userService from '../services/customers/users/user.service';
import stripeSubscriptionServices from '../services/stripe/subscription'

/** Set stripe coupon */
(async () => {
      try {
            const users = await UserModel.find(
                  { 'stripe.subscriptionId': { $exists: true }, 'stripe.coupon': { $exists: false } }
            )
                  .select(['stripe.subscriptionId'])
                  .lean().exec();

            await Promise.all(users.map(async user => {
                  try {
                        const subscription = await stripeSubscriptionServices
                              .retrieveSubscription(
                                    user.stripe.subscriptionId
                              )
                        const couponId = subscription?.discount?.coupon?.id
                        if (couponId) {
                              await userService.updateUser(
                                    { _id: user._id }, { 'stripe.coupon': couponId }
                              );
                        }
                  } catch (error) { }
            }))

            console.log(
                  'Coupon added successfully'
            );

      } catch ({ message }) {
            console.log(
                  'Set coupon script execution failed, Error: ',
                  message
            )
      }
      return true;
})();
