import cron from 'cron';
import config from "../../config";
import { publishContent } from '../constants/cron.constants'
import { ExpertCuratedModel, BookSummaryModel, UserModel, RatingModel } from '../models';
import { randomNumberInRange, pushNotification } from '../lib/utils/utils'
import { awsBucket } from '../constants/app.constant';

const start = async () => {
      try {
            console.log('JOB(🟢) publish contents Started successfully!');

            /** Find unpublish books */
            const unpublishBooks = await BookSummaryModel.find({ publish: true }).select('_id').lean().exec();

            /** Find unpublish curateds */
            const unpublishCurateds = await ExpertCuratedModel.find({ publish: false }).select('_id').lean().exec();

            /** Publish first in  */
            if (unpublishBooks.length && unpublishBooks[0]?._id) {
                  await BookSummaryModel.findOneAndUpdate({ _id: unpublishBooks[0]?._id }, { publish: true })

                  const newPubishBook = await BookSummaryModel.findOne(unpublishBooks[0]._id).populate('author').lean().exec();

                  /** Initialize default ratings for books by machine user */

                  (async () => {
                        try {
                              /** Find bot user */
                              const botUser = await UserModel.findOne({
                                    email: 'bot@holyreads.com'
                              })
                                    .select('_id')
                                    .lean()
                                    .exec()

                              if (!botUser) {
                                    console.log(
                                          'Bot user does not exit'
                                    );
                                    return false;
                              }

                              const star = Number(
                                    `${randomNumberInRange(4, 5)}.${randomNumberInRange(1, 5)}`
                              )

                              await RatingModel.findOneAndUpdate(
                                    { userId: botUser._id, bookId: newPubishBook._id },
                                    { star, updatedAt: new Date() },
                                    { upsert: true }
                              )
                              console.log('Default Ratings added successfully');

                              let totalRating = await RatingModel.findOne({ userId: botUser._id, bookId: newPubishBook._id }).select('star').lean().exec();
                              const rating = totalRating.star
                              const publishContent = { ...newPubishBook, rating }

                              const users = await UserModel.find({
                                    status: 'Active',
                                    timeZone: { $exists: true },
                                    'pushTokens.0': { '$exists': true },
                                    'notification.push': true,
                              }).select('timeZone pushTokens').lean().exec()

                              if (!users.length) {
                                    console.log('JOB(🔴) publish contents execution stop due to no users found');
                              }
                              users.map(i => {
                                    const tokenSet = new Set();
                                    tokenSet.add(
                                          pushNotification(
                                                i?.pushTokens?.map((ti: { token: string }) => ti.token) || [],
                                                '🔔 NEW Publish book for you',
                                                `📙 ${unpublishBooks[0]?.title}`,
                                                JSON.stringify({
                                                      publishContents: {
                                                            _id: publishContent._id,
                                                            description: publishContent.description,
                                                            overview: publishContent.overview,
                                                            bookFor: publishContent.bookFor,
                                                            categories: publishContent.categories,
                                                            coverImageBackground: publishContent.coverImageBackground,
                                                            title: publishContent.title,
                                                            author: publishContent.author,
                                                            views: publishContent.views,
                                                            publish: publishContent.publish,
                                                            coverImage: awsBucket[config.NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + publishContent.coverImage,
                                                            totalStar: publishContent.rating,
                                                            status: publishContent.status,
                                                      }
                                                })
                                          ).catch(() => { return undefined; })
                                    )
                              })
                        } catch ({ message }: any) {
                              console.log(
                                    'Add default ratings script execution failed: Error: ',
                                    message
                              )
                        }
                        return true;
                  })();
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