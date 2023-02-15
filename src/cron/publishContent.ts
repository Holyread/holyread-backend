import cron from 'cron';
import config from "../../config";
import { publishContent } from '../constants/cron.constants'
import { ExpertCuratedModel, BookSummaryModel } from '../models';

const start = async () => {
      try {
            console.log('JOB(🟢) publish contents Started successfully!');
            /** Find unpublish books */
            const unpublishBooks = await BookSummaryModel.find({ publish: false }).select('_id').lean().exec();
            /** Find unpublish curateds */
            const unpublishCurateds = await ExpertCuratedModel.find({ publish: false }).select('_id').lean().exec();
            
            /** Publish first in  */
            if (unpublishBooks.length && unpublishBooks[0]?._id) {
                  await BookSummaryModel.findOneAndUpdate({ _id: unpublishBooks[0]?._id }, { publish: true })
            }
            if (unpublishCurateds.length && unpublishCurateds[0]?._id) {
                  await ExpertCuratedModel.findOneAndUpdate({ _id: unpublishCurateds[0]?._id }, { publish: true })
            }
            console.log('JOB(✅) publish contents executed successfully!');
      } catch (error: any) {
            console.log('JOB(🔴) publish contents execution Error is - ', error.message);
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) publish contents not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(publishContent.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) publish contents initiated successfully!');
})(publishContent, config);