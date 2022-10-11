import cron from 'cron';

import config from "../../config";
import { dailyDevotional } from '../constants/cron.constants'
import { decodeHTMLEntities, groupByKey, pushNotification } from '../lib/utils/utils';
import { ReadsOfDayModel, SettingModel, UserModel } from '../models';

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
            readOfDay.description = decodeHTMLEntities(readOfDay?.description?.trim()?.replace(/<[^>]+>/g, '').substring(0, 100))

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
            const setting = await SettingModel.findOne({}).select('dailyDevotionalTime').lean().exec();
            Object.keys(result).map(i => {
                  try {
                        const dateStr = new Date().toLocaleString('en-US', { timeZone: i })
                        const timeValues = dateStr.split(', ')[1];
                        const time = timeValues.split(' ');
                        const [hours, minutes]: any = time[0].split(':');

                        const dailyDevotionalTime: any = setting?.dailyDevotionalTime?.split(':') || ['8', '0'];
                        let meridian = 'PM';

                        if (Number(dailyDevotionalTime[0]) > 12) {
                              meridian = 'PM';
                              dailyDevotionalTime[0] = Number(dailyDevotionalTime[0]) - 12;
                        } else if (Number(dailyDevotionalTime[0]) < 12) {
                              meridian = 'AM';
                              if (Number(dailyDevotionalTime[0]) == 0) dailyDevotionalTime[0] = 12;
                        }

                        if (time[1] === meridian && hours == dailyDevotionalTime[0] && Number(minutes) === Number(dailyDevotionalTime[1])) {
                              const tokenSet = new Set();
                              result[i]?.map(item => {
                                    tokenSet.add(
                                          pushNotification(
                                                item?.pushTokens?.map((ti: { token: string }) => ti.token) || [],
                                                readOfDay.title,
                                                readOfDay.description + '...'
                                          )
                                    )
                              })
                              Promise.all([...tokenSet]);
                        }
                  } catch (error: any) {
                        console.log('Users processing error - ', error.message)
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
