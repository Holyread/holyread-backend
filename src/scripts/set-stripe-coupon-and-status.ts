import { UserModel } from '../models';
import userService from '../services/customers/users/user.service';
import stripeSubscriptionServices from '../services/stripe/subscription'

/** Set stripe coupon */
(async () => {
      try {
            const users = await UserModel.find({
                  'stripe.subscriptionId': { $exists: true },
                  $or: [
                        {
                              'stripe.coupon': { $exists: false },
                        },
                        {
                              'stripe.status': { $exists: false }
                        }
                  ],
            })
                  .select(['stripe'])
                  .lean().exec();

            await Promise.all(users.map(async user => {
                  try {
                        const subscription = await stripeSubscriptionServices
                              .retrieveSubscription(
                                    user.stripe.subscriptionId
                              )
                        const couponId = subscription?.discount?.coupon?.id
                        const body = {}
                        if (couponId) {
                              body['stripe.coupon'] = couponId;
                        }
                        if (subscription.status) {
                              body['stripe.status'] = subscription.status;
                        }
                        await userService.updateUser(
                              { _id: user._id }, body
                        );
                  } catch (error) { }
            }))

            console.log(
                  'Coupon added successfully'
            );

      } catch ({ message }: any) {
            console.log(
                  'Set coupon script execution failed, Error: ',
                  message
            )
      }
      return true;
})();
