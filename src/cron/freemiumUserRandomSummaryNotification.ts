import { CronJob } from 'cron';
import config from '../../config';
import { scheduleFreemiumUserRandomSummaryNotification } from '../constants/cron.constants'
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel } from '../models';
import { calculateDateInThePast, pushNotification } from '../lib/utils/utils'
import { awsBucket } from '../constants/app.constant';
import subscriptionsService from '../services/customers/subscriptions/subscriptions.service';
import userService from '../services/customers/users/user.service';

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
        }).select('libraries timeZone pushTokens').populate('libraries').lean().exec();

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
        const notificationsSent = [];
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
            const notificationPayload = {
                title: '🔔 Free Summary For YOU! 😊',
                body: `📙 Enjoy your free daily summary ${bookDetails.title}.`,
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
                notificationsSent.push({
                    title: bookDetails.title,
                    bookId: bookDetails._id,
                    userId: user._id,
                    success: true,
                });
                await userService.updateUserLibrary(
                    { _id: user.libraries._id },
                    { $push: { freeNotificationBooks: { bookId: bookDetails._id, createdAt: new Date() } } }
                );
            } catch (error: any) {
                notificationsSent.push({
                    userId: user._id,
                    success: false,
                    errorMessage: error.message,
                });
            }
        }
        // Log Success
        console.log('JOB(✅) schedule freemium user random summary notification executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

        // Log Notifications Sent
        for (const notification of notificationsSent) {
            const notificationLog = new NotificationsModel({
                userId: notification.userId,
                type: 'user',
                notification: {
                    title: '🔔 Summary for free 😊',
                    description: `📙 Just for you, one free access to the ${notification.title} summary.`,
                    bookId: notification?.bookId,
                    success: notification.success,
                    errorMessage: notification.errorMessage,
                },
                createdAt: new Date(),
            });
            await notificationLog.save();
        }
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

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) schedule freemium user random summary notification not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(scheduleFreemiumUserRandomSummaryNotification.SCHEDULE).join(' ');
    new CronJob(schedule, () => { start() }, undefined, true);
    console.log('JOB(🟢) schedule freemium user random summary notification initiated successfully!');
})(scheduleFreemiumUserRandomSummaryNotification, config);
