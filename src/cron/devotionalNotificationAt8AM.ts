import cron from 'cron';

import config from "../../config";
import { readsOfDayDisplayAt } from '../constants/cron.constants'
import { groupByKey } from '../lib/utils/utils';
import { ReadsOfDayModel, UserModel } from '../models';

const start = async () => {
      try {
            console.log('JOB(🟢) Reads of day display date filling Started successfully!');
            const start = new Date();
            start.setDate(new Date().getDate() - 4);
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            /** Get Read of days */
            const readOfDay = await ReadsOfDayModel.findOne({ displayAt: { $gte: new Date(start), $lte: new Date(end) } }).sort([['displayAt', 'DESC']]).lean().exec();
            if (!readOfDay) {
                  console.log('JOB(🔴) Reads of day display date filling execution stop due to no reads found');
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
                  console.log('JOB(🔴) Reads of day display date filling execution stop due to no users found');
                  return;
            }
            Object.keys(users).map(i => {
                  // '9/13/2022, 7:06:51 PM'
                  const dateStr = new Date().toLocaleString('en-US', { timeZone: i })
                  const [dateValues, timeValues] = dateStr.split(', ');

                  const [month, day, year] = dateValues.split('/');
                  const time = timeValues.split(' ');
                  const period = time[1];
                  let [hours, minutes, seconds]: any = time[0].split(':');

                  if (period === 'PM') hours = eval(hours) * 2;
                  const date = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
                  const notificationDate = new Date()
                  console.log(date, notificationDate)
            })
            // new Date().toLocaleTimeString('en-US', { timeZone: 'America/Argentina/Ushuaia' });
            const result = groupByKey(users, 'timeZone');
            console.log(result)

            /** Find reads of days list have missing displayAt */
            // const missingDatesReadsOfDays = await ReadsOfDayModel.find({ displayAt: { $exists: false } }).select('_id').lean().exec();
            // if (!missingDatesReadsOfDays?.length) {
            //       return;
            // }
            // const lastDisplayAtDateRecord = await ReadsOfDayModel.findOne({}).sort({ displayAt: -1 }).select('displayAt').lean();

            // /** start date as today or last displayAt of record */
            // const start: any = new Date(lastDisplayAtDateRecord?.displayAt)?.setDate(new Date(lastDisplayAtDateRecord?.displayAt)?.getDate() + 1) || new Date().setDate(new Date().getDate() - 4);
            // const end = (start * 1) + ((missingDatesReadsOfDays.length) * 24 * 3600 * 1000);

            // /** dates array equal to missing dates records length */
            // const dates = getDates(start, end);
            // if (!dates.length) {
            //       throw new Error('Failed to fetch dates!');
            // }

            // /** Fill display at date in all missing dates records  */
            // let promises = []
            // for (let i = 0; i < missingDatesReadsOfDays.length; i++) {
            //       const item = missingDatesReadsOfDays[i];
            //       if (promises.length && promises.length % 1000 === 0) {
            //             await Promise.all(promises);
            //             promises = [];
            //       }
            //       promises.push(ReadsOfDayModel.findOneAndUpdate({ _id: item._id }, { displayAt: dates[i] }))
            // }
            // if (promises.length) {
            //       await Promise.all(promises)
            // }
            console.log('JOB(✅) Reads of day display date filling executed successfully!');
      } catch (error: any) {
            console.log('JOB(🔴) Reads of day display date filling execution Error is - ', error.message);
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) Reads of day display date filling not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(readsOfDayDisplayAt.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Reads of day display date filling initiated successfully!');
})(readsOfDayDisplayAt, config);