import cron from 'cron';
import config from "../../config";
import { publishContent } from '../constants/cron.constants';
import { ExpertCuratedModel, BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel } from '../models';
import { randomNumberInRange, pushNotification } from '../lib/utils/utils';
import { awsBucket } from '../constants/app.constant';
import { io } from '../app';
import { fetchNotifications } from '../controllers/customers/notification.controller';
import notificationsService from '../services/customers/notifications/notifications.service';

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

            // Find unpublished curated content
            const unpublishCurateds = await ExpertCuratedModel.find({ publish: false }).select('_id').lean().exec();

            // Publish the first unpublished book
            if (unpublishBooks.length && unpublishBooks[0]?._id) {
                  await BookSummaryModel.findOneAndUpdate({ _id: unpublishBooks[0]?._id }, { publish: true, publishedAt: new Date() });

                  // Get details of the newly published book
                  const newPublishedBook = await BookSummaryModel.findOne({ _id: unpublishBooks[0]._id }).select([
                        '_id',
                        'description',
                        'overview',
                        'bookFor',
                        'categories',
                        'coverImageBackground',
                        'title',
                        'author',
                        'views',
                        'coverImage',
                        'totalStar',
                        'status'
                  ]).populate('author')
                        .lean()
                        .exec();

                  let bookDetails;
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
                        bookDetails = { ...newPublishedBook, bookRating };

                        // Prepare content for notification
                        const paragraph = bookDetails.overview;
                        const withoutNbsp = paragraph.replace(/&nbsp;/g, '');
                        content = withoutNbsp.replace(/<\/?[^>]+(>|$)/g, '');
                  } catch (error: any) {
                        console.log('Add default ratings execution failed: Error: ', error.message);
                  }

                  // Find users and send notifications for the new published book
                  const users = await UserModel.find({
                        status: 'Active',
                        // timeZone: { $exists: true },
                        // 'pushTokens.0': { $exists: true },
                        'notification.push': true,
                  }).select('pushTokens notification device').lean().exec();

                  if (!users.length) {
                        console.log('JOB(🔴) publish contents execution stop due to no users found');
                  }

                  for (const user of users) {
                        const { title, description, data } = generateNotificationContent(content, bookDetails);

                        await sentNotification(title, description, data, user);
                  }
            }

            // Publish the first unpublished curated content
            if (unpublishCurateds.length && unpublishCurateds[0]?._id) {
                  await ExpertCuratedModel.findOneAndUpdate({ _id: unpublishCurateds[0]?._id }, { publish: true });
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

const generateNotificationContent = (content: any, bookDetails: any) => {
      return {
            title: '🔔 NEW Publish book for you',
            description: `📙 Explore the latest with titles like ${content}`,
            data: {
                  publishContents: {
                        _id: bookDetails._id,
                        description: bookDetails.description,
                        overview: bookDetails.overview,
                        bookFor: bookDetails.bookFor,
                        categories: bookDetails.categories,
                        coverImageBackground: bookDetails.coverImageBackground,
                        title: bookDetails.title,
                        author: bookDetails.author,
                        views: bookDetails.views,
                        coverImage: `${awsBucket[config.NODE_ENV].s3BaseURL}/${awsBucket.bookDirectory}/coverImage/${bookDetails.coverImage}`,
                        totalStar: bookDetails.bookRating.star,
                        status: bookDetails.status,
                  }
            }
      }
};

const sentNotification: any = async (title: string, description: string, data: any, user: any) => {
      try {
            await NotificationsModel.create({
                  userId: user._id,
                  type: 'user',
                  notification: {
                        title,
                        description,
                        success: true,
                        errorMessage: null,
                  },
                  createdAt: new Date()
            });

            if (user.device === 'web') {
                  // Send notification to web
                  await notificationsService.createNotification({ userId: user._id, type: 'user', notification: { title, description } })
                  fetchNotifications(io.sockets, { _id: user._id });
            } else {
                  // Send push notification to mobile
                  if (
                        user?.notification?.subscription &&
                        user?.notification?.push &&
                        user.pushTokens.length > 0
                  ) {
                        const tokens: string[] = user.pushTokens.map(i => i.token);
                        pushNotification(tokens, title, description, JSON.stringify(data));
                  }
            }
      } catch (error: any) {
            console.log('Users processing error -', error.message);
            await NotificationsModel.create({
                  userId: user._id,
                  type: 'user',
                  notification: {
                        title,
                        description,
                        success: false,
                        errorMessage: `Users processing error - ${error.message}`,
                  },
                  createdAt: new Date()
            });
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
