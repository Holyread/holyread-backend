import cron from 'cron';

import config from "../../config";
import { dailyDevotional } from '../constants/cron.constants'
import { groupByKey, pushNotification } from '../lib/utils/utils';
import { ReadsOfDayModel, UserModel } from '../models';

const start = async () => {
      try {
            console.log('JOB(🟢) Daily devotional Started successfully!');
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            /** Get Read of days */
            const readOfDay = await ReadsOfDayModel.findOne({
                  displayAt: { $gte: new Date(start), $lte: new Date(end) }
            }).lean().exec();
            if (!readOfDay) {
                  console.log('JOB(🔴) Daily devotional execution stop due to no reads found');
                  return;
            }

            const users = await UserModel.find({
                  status: 'Active',
                  timeZone: { $exists: true },
                  'pushTokens.0': { '$exists': true },
                  'notification.dailyDevotional': true,
                  'notification.push': true,
            }).select('timeZone pushTokens').lean().exec()

            if (!users.length) {
                  console.log('JOB(🔴) Daily devotional execution stop due to no users found');
                  return;
            }
            const result = groupByKey(users, 'timeZone');
            Object.keys(result).map(i => {
                  const dateStr = new Date().toLocaleString('en-US', { timeZone: i })
                  const timeValues = dateStr.split(', ')[1];
                  const time = timeValues.split(' ');
                  const period = time[1];
                  const [hours, minutes]: any = time[0].split(':');

                  if (period === 'AM' && hours === '8' && eval(minutes) <= 1) {
                        const tokenSet = new Set();
                        result[i]?.map(item => {
                              tokenSet.add(
                                    pushNotification(
                                          item?.pushTokens?.map((ti: { token: string }) => ti.token) || [],
                                          readOfDay.title,
                                          (readOfDay?.description?.trim()?.replace(/<[^>]+>/g, '').substring(0, 70) || readOfDay.title) + '...'
                                    )
                              )
                        })
                        Promise.all([...tokenSet]);
                  }
            })

            console.log('JOB(✅) Daily devotional executed successfully!');
      } catch (error: any) {
            console.log('JOB(🔴) Daily devotional execution Error is - ', error.message);
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) Daily devotional not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(dailyDevotional.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Daily devotional initiated successfully!');
})(dailyDevotional, config);