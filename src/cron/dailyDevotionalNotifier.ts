import cron from 'cron';

import config from "../../config";
import { dailyDevotional } from '../constants/cron.constants'
import { groupByKey, pushNotification, convertToPlain, sentEmail } from '../lib/utils/utils';
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
            const notificationHour = 8;
            Object.keys(result).map(i => {

                  const dateStr = new Date().toLocaleString('en-US', { timeZone: i })
                  const [dateValues, timeValues] = dateStr.split(', ');
                  const [month, day, year] = dateValues.split('/');
                  const time = timeValues.split(' ');
                  const period = time[1];
                  let [hours, minutes, seconds]: any = time[0].split(':');

                  if (period === 'PM') hours = eval(hours) * 2;
                  const currentAt = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
                  let notificationAt = new Date();
                  notificationAt.setHours(notificationHour, 0, 0, 0);
                  const remainTime = notificationAt.getTime() - currentAt.getTime();

                  const tokenSet = new Set();
                  const title = readOfDay.title
                  const description = convertToPlain(readOfDay.description)
                  /** collect and store user token into token sent */
                  result[i]?.map(item => {
                        tokenSet.add(
                              pushNotification(
                                    item?.pushTokens?.map((ti: { token: string }) => ti.token) || [],
                                    title,
                                    (description?.trim()?.split(".")[0]?.substring(0, 25) || title) + '...'
                              )
                        )
                  })
                  /** if time zone far from 8AM */
                  if (remainTime >= 0) {
                        setTimeout(() => {
                              Promise.all([...tokenSet]);
                              /** Track daily notfication time */
                              sentEmail(config.SMTP_EMAIL, 'Daily devotional notification logs for specific timezone', JSON.stringify({
                                    timeZone: i,
                                    sentAt: new Date().toLocaleString('en-US', { timeZone: i }),
                                    totalUsers: result[i].length
                              }, null, 4))
                        }, remainTime);
                        return;
                  }

                  /** if time zone goes away from 8AM then notify on next day */
                  let currentEndAt = new Date(currentAt)
                  currentEndAt.setHours(23, 59, 59, 999);
                  const nextDayRemainTime = (currentEndAt.getTime() + (notificationHour * 60 * 60 * 1000)) - currentAt.getTime();
                  if (nextDayRemainTime < 0) {
                        console.log('Schedule not process due to faild to get time');
                        return;
                  }
                  setTimeout(() => {
                        Promise.all([...tokenSet])
                        /** Track daily notfication time */
                        sentEmail(config.SMTP_EMAIL, 'Daily devotional notification logs for specific timezone', JSON.stringify({
                              timeZone: i,
                              sentAt: new Date().toLocaleString('en-US', { timeZone: i }),
                              totalUsers: result[i].length
                        }, null, 4))
                  }, nextDayRemainTime);
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