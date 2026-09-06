import { CronJob } from 'cron';
import stripeSubscriptionServices from '../services/stripe/subscription'

import { UserModel } from '../models';
import resolveCronSchedule from './cronGuard';
import userService from '../services/customers/users/user.service';
import { cronDirectory } from '../constants/app.constant';

/**
 * Start the coupon add job.
 */
const start = async () => {
  try {
    console.log('JOB(🟢) coupon add Started successfully!');

    // Find users with a subscription and no coupon or status
    const users = await UserModel.find({
      $and: [
        { "stripe.subscriptionId": { $exists: true } },
        {
          $or: [
            { "stripe.status": { $exists: false } },
            { "stripe.status": { $ne: "active" } },
            { "stripe.coupon": { $exists: false } },
            { "stripe.coupon": { $eq: undefined } },
          ],
        },
      ],
    })
      .select(["stripe"])
      .lean()
      .exec();

    // Update users with coupon and status information
    for (const user of users) {
      try {
        const subscription = await stripeSubscriptionServices.retrieveSubscription(user.stripe.subscriptionId);
        const couponId = subscription?.discount?.coupon?.id;

        const body = {
          ...(couponId && { 'stripe.coupon': couponId }),
          ...(subscription?.status && { 'stripe.status': subscription.status }),
        };
        await userService.updateUser({ _id: user._id }, body);
      } catch (error) {
        continue;
      }

    }

    console.log('JOB(✅) coupon added successfully!');
  } catch (error: any) {
    console.log('JOB(🔴) coupon add Error is - ', error.message);
  }
};


(async () => {
  const schedule = await resolveCronSchedule(
    cronDirectory.SETSTRIPECOUPONANDSTATUS,
    'coupon add'
  );

  if (!schedule) {
    return;
  }
  new CronJob(schedule, () => { start() }, undefined, true);
  console.log('JOB(🟢) coupon add initiated successfully!');
})();
