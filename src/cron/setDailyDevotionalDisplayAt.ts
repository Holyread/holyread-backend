import { CronJob } from 'cron';
import config from '../../config';
import { setReadsOfDayDisplayAt } from '../constants/cron.constants'
import { getDates } from '../lib/utils/utils'
import { DailyDvotionalModel } from '../models';

const start = async () => {
      try {
            console.log('JOB(🟢) Reads of day display date filling Started successfully!');
            /** Find reads of days list have missing displayAt */
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const upcomingReadsOfDays = await DailyDvotionalModel.find({ displayAt: { $gte: now } }).select('_id').lean().exec();

            if (!upcomingReadsOfDays.length) {
                  await DailyDvotionalModel.updateMany({}, { $unset: { displayAt: 1 } })
            }

            const missingDatesReadsOfDays = await DailyDvotionalModel.find({ displayAt: { $exists: false } }).select('_id').lean().exec();
            if (!missingDatesReadsOfDays?.length) {
                  return;
            }
            const lastDisplayAtDateRecord = await DailyDvotionalModel.findOne({}).sort({ displayAt: -1 }).select('displayAt').lean();

            /** start date as today or last displayAt of record */
            const start: any =
                  new Date(lastDisplayAtDateRecord?.displayAt)?.setDate(new Date(lastDisplayAtDateRecord?.displayAt)?.getDate() + 1) ||
                  new Date().setDate(new Date().getDate() - 4);
            const end = (start * 1) + ((missingDatesReadsOfDays.length) * 24 * 3600 * 1000);

            /** dates array equal to missing dates records length */
            const dates = getDates(start, end);
            if (!dates.length) {
                  throw new Error('Failed to fetch dates!');
            }

            /** Fill display at date in all missing dates records  */
            let promises = []
            for (let i = 0; i < missingDatesReadsOfDays.length; i++) {
                  const item = missingDatesReadsOfDays[i];
                  if (promises.length && promises.length % 1000 === 0) {
                        await Promise.all(promises);
                        promises = [];
                  }
                  promises.push(DailyDvotionalModel.findOneAndUpdate({ _id: item._id }, { displayAt: dates[i] }).catch(() => { return undefined; }))
            }
            if (promises.length) {
                  await Promise.all(promises)
            }
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
      const schedule = Object.values(setReadsOfDayDisplayAt.SCHEDULE).join(' ');
      new CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Reads of day display date filling initiated successfully!');
})(setReadsOfDayDisplayAt, config);
