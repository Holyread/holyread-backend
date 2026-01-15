import { CronJob } from 'cron';
import config from '../../config';
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel, CronScheduleModel } from '../models';
import { pushNotification, randomNumberInRange } from '../lib/utils/utils';
import { awsBucket, cronDirectory } from '../constants/app.constant';
import languageService from '../services/admin/language/language.service';

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

            const langauges = await languageService.getLanguage({});

            let newPublishedBooks: any[] = [];

            for (const lang of langauges) {
              const book = await BookSummaryModel.findOneAndUpdate(
                { publish: false, language: lang._id },
                {
                  publish: true,
                  publishedAt: new Date(),
                  views: randomNumberInRange(700, 2500),
                },
                {
                  sort: { createdAt: 1 },
                  new: true,
                }
              )
                .populate("author")
                .lean()
                .exec();

              if (!book) {
                console.log(`🔴 No unpublished book for ${lang?.name}`);
                continue;
              }

              newPublishedBooks.push(book);
            }

            let publishContent;
            let content;
    
            for (const book of newPublishedBooks) {
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
                              { userId: botUser._id, bookId: book._id },
                              { star, updatedAt: new Date() },
                              { upsert: true }
                        );

                        // Get book rating
                        const bookRating = await RatingModel.findOne({ userId: botUser._id, bookId: book._id }).select('star').lean().exec();
                        publishContent = { ...book, bookRating };

                        // Prepare content for notification
                        const paragraph = publishContent.overview;
                        const withoutNbsp = paragraph.replace(/&nbsp;/g, '');
                        content = withoutNbsp.replace(/<\/?[^>]+(>|$)/g, '');
                  } catch (error: any) {
                        console.log('Add default ratings execution failed: Error: ', error.message);
                  }

                  // Find users and send push notifications for the new published book
                  const users: any = await UserModel.find({
                        status: 'Active',
                        timeZone: { $exists: true },
                        language: book.language,
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
                                                totalStar: publishContent.totalStar,
                                                status: publishContent.status,
                                          },
                                    })
                              );

                              // Log notification sent
                              const notificationLog = new NotificationsModel({
                                    userId: user._id,
                                    type: 'book',
                                    notification: {
                                          title: '🔔 NEW Summary for you!',
                                          description: `📙 Explore the latest summary "${content}"`,
                                          success: true,
                                          errorMessage: undefined,
                                    },
                                    createdAt: new Date(),
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
                                    createdAt: new Date(),
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
                  message: `publish contents execution Error is: ${error.message}`,
            });
            await cronLog.save();
      }
};

(async (config) => {
      const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.PUBLISHCONTENT }).lean().exec();

      if (!cronSchedule) {
            console.log('Job not found');
            return;
      }
      if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
            console.log(`JOB(🟡) publish contents not initiated due to ${config.NODE_ENV} Environment`);
            return;
      }
      const schedule = Object.values(cronSchedule.schedule).join(' ');
      new CronJob(schedule, () => { startPublishContentJob() }, undefined, true);
      console.log('JOB(🟢) publish contents initiated successfully!');
})(config);
