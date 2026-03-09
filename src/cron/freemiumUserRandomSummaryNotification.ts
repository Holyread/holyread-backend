import { CronJob } from 'cron';
import config from '../../config';
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel, CronScheduleModel } from '../models';
import { calculateDateInThePast, pushNotification } from '../lib/utils/utils'
import { awsBucket, cronDirectory } from '../constants/app.constant';
import subscriptionsService from '../services/customers/subscriptions/subscriptions.service';
import userService from '../services/customers/users/user.service';
import { getNotificationTemplate } from '../lib/helpers/notificationTemplate.helper';
import { NOTIFICATION_TEMPLATE, NOTIFICATION_TEMPLATE_FALLBACKS } from '../constants/notificationTemplate.constant';

const start = async () => {
    try {
        console.log('JOB(🟢) schedule freemium user random summary notification started successfully!');

        let bookDetails;

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'schedule_freemium_user_random_summary_notification',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        const yesterday = calculateDateInThePast(1);

        // Find active users with a defined timeZone and at least one push token
        const users: any = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { '$exists': true },
            'notification.push': true,
            'createdAt': { $lte: yesterday },
            isSignedUp: true
        }).select('libraries timeZone pushTokens language').populate('libraries').lean().exec();

        const freemiumUsers: any[] = [];

        for (const user of users) {
            const userSubscriptionStatus = await subscriptionsService.getUserSubscriptionStatus(user);
            if (userSubscriptionStatus === 'freemium') {
                freemiumUsers.push(user);
            }
        }

        // Filter freemium users based on category
        const userFavoriteCategories = freemiumUsers.filter(user =>
            user.libraries && user.libraries.categories && user.libraries.categories.length > 0
        );

        function getRandomBookFromFavoriteCategories(userData) {
            const categoryArray = userData.libraries.categories;
            const randomIndex = Math.floor(Math.random() * categoryArray.length);
            return categoryArray[randomIndex];
        }

        // Send notifications to matching users
        for (const user of userFavoriteCategories) {
            const randomBookCategory = getRandomBookFromFavoriteCategories(user);

            const unreadBook = await BookSummaryModel.findOne({
                categories: { $in: [randomBookCategory] },
                _id: {
                    $nin: [
                        ...user.libraries.freeNotificationBooks.map(b => b.bookId)
                    ]
                },
            }).select([
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
                'status',
            ]).populate('author').lean().exec();

            if (!unreadBook) {
                await userService.updateUserLibrary(
                    { _id: user.libraries._id },
                    { freeNotificationBooks : [] }
                ); 
                continue;
            }

            /** Get book rating */
            const bookRating = await RatingModel.findOne({ bookId: unreadBook._id }).select('star').lean().exec();
            bookDetails = { ...unreadBook, bookRating };

            const tokens = user.pushTokens.map(token => token.token);

            const { title, description } = await getNotificationTemplate(
              NOTIFICATION_TEMPLATE.freeDailySummary,
              user?.language,
              NOTIFICATION_TEMPLATE_FALLBACKS[
                NOTIFICATION_TEMPLATE.freeDailySummary
              ],
            );

            const notificationPayload = {
                title,
                body: description.replace("{bookTitle}", bookDetails.title),
                data: {
                    publishContents: {
                        _id: bookDetails?._id,
                        description: bookDetails.description,
                        overview: bookDetails.overview,
                        bookFor: bookDetails.bookFor,
                        categories: bookDetails.categories,
                        coverImageBackground: bookDetails.coverImageBackground,
                        title: bookDetails.title,
                        author: bookDetails.author,
                        views: bookDetails.views,
                        coverImage: `${awsBucket[config.NODE_ENV].s3BaseURL}/${awsBucket.bookDirectory}/coverImage/${bookDetails.coverImage}`,
                        totalStar: bookDetails.totalStar,
                        status: bookDetails.status,
                    },
                },
            };
            try {
                await pushNotification(
                    tokens,
                    notificationPayload.title,
                    notificationPayload.body,
                    JSON.stringify(notificationPayload.data)
                );
                const notificationLog = new NotificationsModel({
                    userId: user._id,
                    type: 'book',
                    notification: {
                        title: notificationPayload.title,
                        description: notificationPayload.body,
                        bookId: bookDetails?._id,
                        success: true,
                        errorMessage: undefined,
                    },
                    createdAt: new Date(),
                });
                await notificationLog.save();
                await userService.updateUserLibrary(
                    { _id: user.libraries._id },
                    { $push: { freeNotificationBooks: { bookId: bookDetails._id, createdAt: new Date() } } }
                );
            } catch (error: any) {
                console.log('JOB(🔴) Users processing error -', error.message);
                const notificationLog = new NotificationsModel({
                    userId: user._id,
                    type: 'book',
                    notification: {
                        title: notificationPayload.title,
                        description: notificationPayload.body,
                        bookId: bookDetails?._id,
                        success: false,
                        errorMessage: `Users processing error -', ${error.message}`,
                    },
                    createdAt: new Date(),
                });
                await notificationLog.save();
            }
        }
        // Log Success
        console.log('JOB(✅) schedule freemium user random summary notification executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

    } catch (error: any) {
        // Log Error
        console.log('JOB(🔴) schedule freemium user random summary notification execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'schedule_freemium_user_random_summary_notification',
            status: 'failed',
            endedAt: new Date(),
            message: `schedule freemium user random summary notification job failed: ${error.message}`,
        });
        await cronLog.save();
    }
};

(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.SCHEDULEFREEMIUMUSERRANDOMSUMMARYNOTIFICATION }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    }
    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) schedule freemium user random summary notification not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { start() }, undefined, true);
    console.log('JOB(🟢) schedule freemium user random summary notification initiated successfully!');
})(config);
