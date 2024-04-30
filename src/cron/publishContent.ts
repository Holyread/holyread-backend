import cron from 'cron';
import config from "../../config";
import { publishContent } from '../constants/cron.constants';
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel } from '../models';
import { randomNumberInRange, pushNotification } from '../lib/utils/utils';
import { awsBucket } from '../constants/app.constant';

const startPublishContentJob = async () => {
      try {
            console.log('JOB(🟢) publish contents Started successfully!');

            // Execution Log
            const cronLog = new CronLogModel({
                  jobName: 'publish_contents',
                  status: 'running',
                  startedAt: new Date(),
            });
            await cronLog.save();

            // Find unpublished books
            const unpublishBooks = await BookSummaryModel.find({ publish: false }).select('_id').lean().exec();

            // Publish the first unpublished book
            if (unpublishBooks.length && unpublishBooks[0]?._id) {
                  await BookSummaryModel.findOneAndUpdate({ _id: unpublishBooks[0]?._id }, { publish: true, publishedAt: new Date() });

                  // Get details of the newly published book
                  const newPublishedBook = await BookSummaryModel.findOne({ _id: unpublishBooks[0]._id })
                        .populate('author')
                        .lean()
                        .exec();

                  let publishContent;
                  let content;

                  // Initialize default ratings for books by machine user
                  try {
                        // Find or create a bot user
                        let botUser: any = await UserModel.findOne({ email: 'bot@holyreads.com' }).select('_id').lean().exec();

                        if (!botUser) {
                              botUser = await UserModel.aggregate([{ $sample: { size: 1 } }]);
                        }

                        // Generate a random rating for the book
                        const star = Number(`${randomNumberInRange(4, 5)}.${randomNumberInRange(1, 5)}`);

                        // Update or create the rating
                        await RatingModel.findOneAndUpdate(
                              { userId: botUser._id, bookId: newPublishedBook._id },
                              { star, updatedAt: new Date() },
                              { upsert: true }
                        );

                        // Get book rating
                        const bookRating = await RatingModel.findOne({ userId: botUser._id, bookId: newPublishedBook._id }).select('star').lean().exec();
                        publishContent = { ...newPublishedBook, bookRating };

                        // Prepare content for notification
                        const paragraph = publishContent.overview;
                        const withoutNbsp = paragraph.replace(/&nbsp;/g, '');
                        content = withoutNbsp.replace(/<\/?[^>]+(>|$)/g, '');
                  } catch (error: any) {
                        console.log('Add default ratings execution failed: Error: ', error.message);
                  }

                  // Find users and send push notifications for the new published book
                  const users = await UserModel.find({
                        status: 'Active',
                        timeZone: { $exists: true },
                        'pushTokens.0': { $exists: true },
                        'notification.push': true,
                        'notification.latestSummariesUploads': true,
                  }).select('pushTokens').lean().exec();

                  if (!users.length) {
                        console.log('JOB(🔴) publish contents execution stop due to no users found');
                  }

                  for (const user of users) {
                        const tokens = user.pushTokens.map(token => token.token);
                        try {
                              await pushNotification(
                                    tokens,
                                    '🔔 NEW Summary for you!',
                                    `📙 Explore the latest summary "${content}"`,
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
                                                coverImage: `${awsBucket[config.NODE_ENV].s3BaseURL}/${awsBucket.bookDirectory}/coverImage/${publishContent.coverImage}`,
                                                totalStar: publishContent.bookRating.star,
                                                status: publishContent.status,
                                          }
                                    })
                              );

                              // Log notification sent
                              const notificationLog = new NotificationsModel({
                                    userId: user._id,
                                    type: 'user',
                                    notification: {
                                          title: '🔔 NEW Summary for you!',
                                          description: `📙 Explore the latest summary "${content}"`,
                                          success: true,
                                          errorMessage: null,
                                    },
                                    createdAt: new Date()
                              });
                              await notificationLog.save();
                        } catch (error: any) {
                              console.log('Users processing error -', error.message);
                              const notificationLog = new NotificationsModel({
                                    userId: user._id,
                                    type: 'user',
                                    notification: {
                                          title: '🔔 NEW Summary for you!',
                                          description: `📙 Explore the latest summary "${content}"`,
                                          success: false,
                                          errorMessage: `Users processing error -', ${error.message}`,
                                    },
                                    createdAt: new Date()
                              });
                              await notificationLog.save();
                        }
                  }
            }

            console.log('JOB(✅) publish contents executed successfully!');
            cronLog.status = 'success';
            cronLog.endedAt = new Date();
            await cronLog.save();
      } catch (error: any) {
            console.log('JOB(🔴) publish contents execution Error is - ', error.message);
            const cronLog = new CronLogModel({
                  jobName: 'publish_contents',
                  status: 'failed',
                  endedAt: new Date(),
                  message: `publish contents execution Error is: ${error.message}`
            });
            await cronLog.save();
      }
};

((cronConfig, config) => {
      if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) publish contents not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(publishContent.SCHEDULE).join(' ');
      new cron.CronJob(schedule, () => { startPublishContentJob() }, null, true);
      console.log('JOB(🟢) publish contents initiated successfully!');
})(publishContent, config);
