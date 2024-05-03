import { UserModel, SubscriptionsModel } from '../models/index'
import stripeSubscriptionServices from '../services/stripe/subscription'
// Set default book views
(async () => {
      try {
            const googleStoreUsers = await UserModel.find({
                  device: 'android',
                  inAppSubscription: { $exists: true },
            }).lean().exec();

            const appStoreUsers = await UserModel.find({
                  device: 'ios',
                  inAppSubscription: { $exists: true },
            }).lean().exec();

            const webUsers = await UserModel.find({
                  device: 'web',
                  stripe: { $exists: true },
            }).lean().exec();

            const subscriptions = await SubscriptionsModel
                  .find({})
                  .lean()
                  .exec();

            const getMonths = (subscription) => {
                  const duration = subscriptions.find(
                        s => String(s._id) === subscription
                  )?.duration;

                  let months = 1;
                  switch (duration) {
                        case 'Month':
                              months = 1;
                              break;
                        case 'Half Year':
                              months = 6;
                              break;
                        case 'Year':
                              months = 12;
                              break;
                        default:
                              break;
                  }
                  return months;
            }
            await Promise.all(appStoreUsers.map(async (item: any) => {
                  try {
                        let body = {}

                        if (
                              item
                                    ?.inAppSubscription
                                    ?.transaction
                                    ?.expiresDate
                        ) {
                              const inAppSubscriptionStatus
                                    = (
                                          new Date(
                                                item
                                                      .inAppSubscription
                                                      .transaction
                                                      .expiresDate
                                          ).getTime()
                                          <
                                          new Date().getTime()
                                    )
                                          ? 'Canceled'
                                          : item.inAppSubscriptionStatus;

                              body = {
                                    'inAppSubscription.expiredAt': new Date(
                                          item
                                                .inAppSubscription
                                                .transaction
                                                .expiresDate
                                    ),
                                    inAppSubscriptionStatus,
                              }
                        } else if (
                              item
                                    ?.inAppSubscription
                                    ?.transactionDate
                        ) {
                              if (
                                    item?.inAppSubscriptionStatus
                                    !==
                                    'Active'
                              ) {
                                    return;
                              }

                              const date = Number(
                                    item?.inAppSubscription?.transactionDate
                              )

                              const expiredAt = new Date(date)

                              expiredAt.setMonth(
                                    new Date(
                                          date
                                    ).getMonth()
                                    +
                                    getMonths(
                                          item?.subscription
                                    )
                              );
                              const inAppSubscriptionStatus
                                    = (
                                          new Date(expiredAt).getTime()
                                          <
                                          new Date().getTime()
                                    )
                                          ? 'Canceled'
                                          : item.inAppSubscriptionStatus;
                              body = {
                                    'inAppSubscription.expiredAt': expiredAt,
                                    inAppSubscriptionStatus,
                              }
                        }

                        await UserModel.updateOne(
                              { _id: item._id },
                              body
                        )
                  } catch ({ message }: any) { console.log(message) }
            }))

            await Promise.all(googleStoreUsers.map(async (item: any) => {
                  try {
                        const dataAndroid = JSON.parse(
                              item?.inAppSubscription?.dataAndroid
                              ||
                              '{}'
                        )

                        let body = {};
                        if (dataAndroid.purchaseTime) {
                              const date = Number(dataAndroid.purchaseTime)
                              const expiredAt = new Date(date)
                              expiredAt.setMonth(
                                    new Date(
                                          date
                                    )
                                          .getMonth()
                                    +
                                    getMonths(
                                          item?.subscription
                                    )
                              );
                              const inAppSubscriptionStatus
                                    = new Date(
                                          expiredAt
                                    )
                                          .getTime()
                                          <
                                          new Date()
                                                .getTime()
                                          ? 'Canceled'
                                          : item.inAppSubscriptionStatus

                              body = {
                                    'inAppSubscription.expiredAt': expiredAt,
                                    inAppSubscriptionStatus,
                              }
                        } else if (
                              item?.inAppSubscription?.transactionDate &&
                              item?.inAppSubscriptionStatus === 'Active'
                        ) {
                              const date = Number(item?.inAppSubscription?.transactionDate)
                              const expiredAt = new Date(date)
                              expiredAt.setMonth(
                                    new Date(
                                          date
                                    )
                                          .getMonth()
                                    +
                                    getMonths(
                                          item?.subscription
                                    )
                              );
                              const inAppSubscriptionStatus
                                    = (
                                          new Date(expiredAt).getTime()
                                          <
                                          new Date().getTime()
                                    ) ? 'Canceled' : item.inAppSubscriptionStatus;

                              body = {
                                    'inAppSubscription.expiredAt': expiredAt,
                                    inAppSubscriptionStatus,
                              }
                        }
                        await UserModel.updateOne(
                              { _id: item._id },
                              body
                        )
                  } catch ({ message }: any) { console.log(message) }
            }))

            await Promise.all(webUsers.map(async (item: any) => {
                  try {
                        if (!item?.stripe?.subscriptionId) { return; }

                        const stripeSubscription
                              = await stripeSubscriptionServices
                                    .retrieveSubscription(
                                          item.stripe.subscriptionId
                                    )

                        stripeSubscription?.current_period_end
                              &&
                              await UserModel.updateOne(
                                    { _id: item._id },
                                    {
                                          'stripe.expiredAt': new Date(
                                                stripeSubscription
                                                      .current_period_end
                                                *
                                                1000
                                          ),
                                    }
                              )
                  } catch ({ message }: any) { console.log(message) }
            }))

            console.log('expiry date added successfully');

      } catch (e: any) {
            console.log(
                  'Set expiry date script execution failed, Error is: ', e
            )
      }
      return true;
})();
