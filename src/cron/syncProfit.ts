import * as cron from 'cron';

import config from '../../config';
import { syncProfits } from '../constants/cron.constants'
import stripeSubscriptionServices from '../services/stripe/subscription'
import transactionServices from '../services/admin/users/transactions.service'

import { RevenueModel } from '../models';

const start = async () => {
      try {
            console.log('JOB(🟢) sync profit Started successfully!');

            let yearlyProfit = await stripeSubscriptionServices.retrieveProfit('year')
            const weeklyProfit = await stripeSubscriptionServices.retrieveProfit('week')
            const monthlyProfit = await stripeSubscriptionServices.retrieveProfit('month')

            const transactionsInfo = await transactionServices.getAllTransactions(
                  0,
                  0,
                  {
                        userId: { $exists: true },
                        device: 'app',
                  },
                  [['createdAt', 'asc']]
            )
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const monthAgo = now;
            monthAgo.setMonth(monthAgo.getMonth() - 1);

            const yearAgo = now;
            yearAgo.setMonth(yearAgo.getDate() - 12);

            const weekAgo = now;
            weekAgo.setDate(weekAgo.getDate() - 7);

            transactionsInfo.transactions.map(i => {
                  if (new Date(i.createdAt).getTime() >= new Date(yearAgo).getTime()) {
                        if (['did_renew', 'subscribed'].includes(i.status)) {
                              yearlyProfit += i.total
                        } else if (['refund'].includes(i.status)) {
                              yearlyProfit -= i.total
                        }
                  }
                  if (new Date(i.createdAt).getTime() >= new Date(monthAgo).getTime()) {
                        if (['did_renew', 'subscribed'].includes(i.status)) {
                              yearlyProfit += i.total
                        } else if (['refund'].includes(i.status)) {
                              yearlyProfit -= i.total
                        }
                  }
                  if (new Date(i.createdAt).getTime() >= new Date(weekAgo).getTime()) {
                        if (['did_renew', 'subscribed'].includes(i.status)) {
                              yearlyProfit += i.total
                        } else if (['refund'].includes(i.status)) {
                              yearlyProfit -= i.total
                        }
                  }
            })

            await RevenueModel.updateOne({}, {
                  year: yearlyProfit,
                  week: weeklyProfit,
                  month: monthlyProfit,
            })
            console.log('JOB(✅) sync profit executed successfully!');
      } catch (error: any) {
            console.log('JOB(🔴) sync profit execution Error is - ', error.message);
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) sync profit not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(syncProfits.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, undefined, true);
      console.log('JOB(🟢) sync profit initiated successfully!');
})(syncProfits, config);
