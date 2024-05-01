import * as cron from 'cron';
import config from '../../config';
import { setStripeCouponAndStatus } from '../constants/cron.constants'
import stripeSubscriptionServices from '../services/stripe/subscription'

import { UserModel } from '../models';
import userService from '../services/customers/users/user.service';

/**
 * Start the coupon add job.
 */
const start = async () => {
  try {
    console.log('JOB(🟢) coupon add Started successfully!');

    // Find users with a subscription and no coupon or status
    const users = await UserModel.find({
      'stripe.subscriptionId': { $exists: true },
      'stripe.status': { $ne: 'active' },
      $or: [
        { 'stripe.coupon': { $exists: false } },
        { 'stripe.coupon': { $eq: undefined } },
      ],
    })
      .select(['stripe'])
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

((cronConfig, config) => {
  if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
    console.log(`JOB(🟡) coupon add not initiated due to ${config.NODE_ENV} Environment`);
    return;
  }
  const schedule = Object.values(setStripeCouponAndStatus.SCHEDULE).join(' ');
  new cron.CronJob(schedule, () => { start() }, undefined, true);
  console.log('JOB(🟢) coupon add initiated successfully!');
})(setStripeCouponAndStatus, config);
