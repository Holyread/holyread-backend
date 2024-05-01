import { CronJob } from 'cron';
import config from '../../config';
import { schedulePersonalizeNotification } from '../constants/cron.constants'
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel } from '../models';
import { pushNotification } from '../lib/utils/utils'
import { awsBucket } from '../constants/app.constant';

const start = async () => {
    try {
        console.log('JOB(🟢) schedule personalize notification started successfully!');

        let bookDetails;

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'schedule_personalize_notification',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        // Find active users with a defined timeZone and at least one push token
        const users: any = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { '$exists': true },
            'notification.push': true,
            'notification.userActivityAlerts': true,
        }).select('libraries timeZone pushTokens').populate('libraries').lean().exec();

        // Filter users based on reading
        const userReadingList = users.filter(user =>
            user.libraries && user.libraries.completed && user.libraries.completed.length > 0
        );

        function getRandomBookFromReading(userData) {
            const readingArray = userData.libraries.reading;
            const randomIndex = Math.floor(Math.random() * readingArray.length);
            return readingArray[randomIndex];
        }

        // Send notifications to matching users
        const notificationsSent = [];
        for (const user of userReadingList) {
            const randomBook = getRandomBookFromReading(user);

            const unreadBook = await BookSummaryModel.findOne({ _id: randomBook.bookId }).select([
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

            /** Get book rating */
            const bookRating = await RatingModel.findOne({ bookId: unreadBook._id }).select('star').lean().exec();
            bookDetails = { ...unreadBook, bookRating };

            const tokens = user.pushTokens.map(token => token.token);
            const notificationPayload = {
                title: '🔔 We have something new for you',
                body: `📙 Lets read ${bookDetails.title}.`,
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
                await pushNotification(tokens, notificationPayload.title, notificationPayload.body, JSON.stringify(notificationPayload.data));
                notificationsSent.push({
                    userId: user._id,
                    success: true,
                });
            } catch (error: any) {
                notificationsSent.push({
                    userId: user._id,
                    success: false,
                    errorMessage: error.message,
                });
            }
        }
        // Log Success
        console.log('JOB(✅) schedule personalize notification executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

        // Log Notifications Sent
        for (const notification of notificationsSent) {
            const notificationLog = new NotificationsModel({
                userId: notification.userId,
                type: 'user',
                notification: {
                    title: '🔔 We have something new for you!',
                    description: `📙 lets read ${bookDetails.title}.`,
                    success: notification.success,
                    errorMessage: notification.errorMessage,
                },
                createdAt: new Date(),
            });
            await notificationLog.save();
        }
    } catch (error: any) {
        // Log Error
        console.log('JOB(🔴) schedule personalize notification execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'schedule_personalize_notification',
            status: 'failed',
            endedAt: new Date(),
            message: `schedule personalize notification job failed: ${error.message}`,
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) schedule personalize notification not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(schedulePersonalizeNotification.SCHEDULE).join(' ');
    new CronJob(schedule, () => { start() }, undefined, true);
    console.log('JOB(🟢) schedule personalize notification initiated successfully!');
})(schedulePersonalizeNotification, config);
