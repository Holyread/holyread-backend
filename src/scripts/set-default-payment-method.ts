import { UserModel } from '../models/index'
import stripeSubscriptionServices from '../services/stripe/subscription'
import fs from 'node:fs';

/** Confirm payment intent */
(async () => {
      try {
            const webUsers = await UserModel.find({
                  device: 'web',
                  stripe: { $exists: true }
            }).lean().exec();
            console.log('total ', webUsers.length);

            const is = await stripeSubscriptionServices.getPaymentIntents()
            console.log('l', is.length)
            const newData = []
            await Promise.all(is.map(async item => {
                  if (item.status === 'requires_payment_method' && item.customer) {
                        // if (customer?.invoice_settings?.default_payment_method) {
                        newData.push({ ...item })
                        // }
                  }
            }))
            await Promise.all(newData.map(async i => {
                  i.customer1 = await stripeSubscriptionServices.getCustomer(i.customer)
            }))
            // fs.writeFileSync('data.json', JSON.stringify(is, null, 4))
            fs.writeFileSync('newData.json', JSON.stringify(newData, null, 4))

            // await Promise.all(webUsers.map(async (item: any) => {
            //       try {
            //             if (!item?.stripe?.subscriptionId) { return; }

            //             const stripeSubscription
            //                   = await stripeSubscriptionServices
            //                         .retrieveSubscription(
            //                               item.stripe.subscriptionId
            //                         )
            //             stripeSubscription?.current_period_end &&
            //                   await UserModel.updateOne(
            //                         { _id: item._id },
            //                         {
            //                               'stripe.expiredAt': new Date(
            //                                     stripeSubscription.current_period_end * 1000
            //                               )
            //                         }
            //                   )
            //       } catch ({ message }) {}
            // }))

            console.log('Confirm payment intents successfully');

      } catch (e: any) {
            console.log('Confirm payment intent script execution failed - ', e)
      }
      return true;
})();
