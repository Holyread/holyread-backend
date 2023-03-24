import cron from 'cron';
import config from "../../config";
import { publishContent } from '../constants/cron.constants'
import { ExpertCuratedModel, BookSummaryModel, UserModel, RatingModel } from '../models';
import { randomNumberInRange } from '../lib/utils/utils'
import { awsBucket } from '../constants/app.constant';
import { pushNotification } from '../lib/utils/utils';

const start = async () => {
      try {
            console.log('JOB(🟢) publish contents Started successfully!');
            /** Find unpublish books */
            const unpublishBooks = await BookSummaryModel
                  .aggregate([
                        {
                              $match: {
                                    publish: false
                              }
                        },
                        {
                              $project: {
                                    title: 1.0,
                                    views: 1.0,
                                    author: 1.0,
                                    bookFor: 1.0,
                                    publish: 1.0,
                                    overview: 1.0,
                                    categories: 1.0,
                                    'coverImage': {
                                          $concat: [
                                                awsBucket[config.NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/',
                                                '$coverImage'
                                          ]
                                    },
                                    description: 1.0,
                                    coverImageBackground: 1.0,
                                    createdAt: -1.0,
                                    'chapters.name': 1.0,
                                    'chapters.size': 1.0,
                              }
                        },
                        {
                              $lookup: {
                                    as: 'author',
                                    foreignField: '_id',
                                    from: 'bookauthors',
                                    localField: 'author',
                              }
                        },
                        {
                              $project: {
                                    'author.createdAt': 0,
                                    'author.__v': 0,
                              }
                        },

                  ]);

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

                        /** Find books */
                        const books = await BookSummaryModel
                              .find({ _id: unpublishBooks[0]?._id })
                              .select('_id')
                              .lean()
                              .exec()

                        if (!books?.length) {
                              console.log('Books store is empty')
                              return false;
                        }
                        await Promise.all(books.map(async book => {
                              const star = Number(
                                    `${randomNumberInRange(4, 5)}.${randomNumberInRange(1, 5)}`
                              )

                              await RatingModel.findOneAndUpdate(
                                    { userId: botUser._id, bookId: book._id },
                                    { star, updatedAt: new Date() },
                                    { upsert: true }
                              )

                              let totalRating = await RatingModel.findOne({ userId: botUser._id, bookId: book._id }).select('star').lean().exec();
                              const rating = totalRating.star
                              const publishContent = { ...unpublishBooks[0], rating }

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
                                                            author: publishContent.author[0],
                                                            views: publishContent.views,
                                                            publish: publishContent.publish,
                                                            coverImage: publishContent.coverImage,
                                                            totalStar: publishContent.rating

                                                      }
                                                })
                                          ).catch(() => { return undefined; })
                                    )
                              })
                        }))

                        console.log('Default Ratings added successfully')
                  } catch ({ message }: any) {
                        console.log(
                              'Add default ratings script execution failed: Error: ',
                              message
                        )
                  }
                  return true;
            })();

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