import cron from 'cron';
import config from "../../config";
import { publishContent } from '../constants/cron.constants'
import { ExpertCuratedModel, BookSummaryModel, UserModel } from '../models';
import { awsBucket } from '../constants/app.constant';
import { pushNotification } from '../lib/utils/utils';

const start = async () => {
      try {
            console.log('JOB(🟢) publish contents Started successfully!');
            /** Find unpublish books */
            const unpublishBooks = await BookSummaryModel.find({ publish: false })
                  .select(['_id',
                        'title',
                        'description',
                        'coverImage',
                        'coverImageBackground']).lean().exec();

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

            const users = await UserModel.find({
                  status: 'Active',
                  timeZone: { $exists: true },
                  'pushTokens.0': { '$exists': true },
                  'notification.push': true,
            }).select('timeZone pushTokens').lean().exec()

            if (!users.length) {
                  console.log('JOB(🔴) publish contents execution stop due to no users found');
                  return;
            }
            users.map(i => {
                  const tokenSet = new Set();
                  unpublishBooks?.map(book => {
                        console.log(book.title)
                        tokenSet.add(
                              pushNotification(
                                    i?.pushTokens?.map((ti: { token: string }) => ti.token) || [],
                                    '🔔 NEW Publish book for you 🔑',
                                    `📙 ${book.title} 🔖 `,
                                    JSON.stringify({
                                          publishContents: {
                                                _id: book._id,
                                                description: book.description,
                                                image: awsBucket[config.NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + book.coverImage
                                          }
                                    })
                              ).catch(() => { return undefined; })
                        )
                  })
            })

           

      } catch (error: any) {
            console.log('JOB(🔴) publish contents execution Error is - ', error.message);
      }
};


((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) Publish contents not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(publishContent.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { start() }, null, true);
      console.log('JOB(🟢) Publish contents initiated successfully!');
})(publishContent, config);