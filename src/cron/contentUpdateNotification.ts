import cron from 'cron';
import config from '../../config';
import { contentUpdateNotification
 } from '../constants/cron.constants'
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel } from '../models';
import { pushNotification } from '../lib/utils/utils'
import { awsBucket } from '../constants/app.constant';

const start = async () => {
    try {
        console.log('JOB(🟢) content update alert Started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'content_update_alert',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        // Execution Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const newPublishBook = await BookSummaryModel.findOne({
            publish: true, publishedAt: {
                $gte: today,
                $lt: tomorrow,
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

        let publishContent;
        let content;

        /** Get book rating */
        const bookRating = await RatingModel.findOne({ bookId: newPublishBook._id }).select('star').lean().exec();
        publishContent = { ...newPublishBook, bookRating };

        const paragraph = publishContent.overview;
        const withoutNbsp = paragraph.replace(/&nbsp;/g, '');
        content = withoutNbsp.replace(/<\/?[^>]+(>|$)/g, '');

        // Find active users with a defined timeZone and at least one push token
        const users: any = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { '$exists': true },
            'notification.push': true,
            'notification.favoriteCategoriesAlerts': true,
        }).select('libraries timeZone pushTokens').populate('libraries').lean().exec();

        // Filter users based on categories
        const usersWithCategories = users.filter(user =>
            user.libraries && user.libraries.categories && user.libraries.categories.length > 0
        );
        const usersMatchingCategories = usersWithCategories.filter(user => {
            return user.libraries.categories.some(category => {
                const categoryId = category.toString(); // Convert ObjectId to string
                return newPublishBook.categories.some(newCategory => newCategory.toString() === categoryId);
            });
        });

        // Send notifications to matching users
        const notificationsSent = [];
        for (const user of usersMatchingCategories) {
            const tokens = user.pushTokens.map(token => token.token);
            const notificationPayload = {
                title: '🔔 Fresh Inspiration Alert!',
                body: `📙 Explore the latest in your favorite category with titles like ${content}.`,
                data: {
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
        console.log('JOB(✅) content update alert executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

        // Log Notifications Sent
        for (const notification of notificationsSent) {
            const notificationLog = new NotificationsModel({
                userId: notification.userId,
                type: 'user',
                notification: {
                    title: '🔔 Fresh Inspiration Alert!',
                    description: `📙 Explore the latest in your favorite category with titles like ${content}.`,
                    success: notification.success,
                    errorMessage: notification.errorMessage,
                },
                createdAt: new Date(),
            });
            await notificationLog.save();
        }
    } catch (error: any) {
        // Log Error
        console.log('JOB(🔴) content update alert execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'content_update_alert',
            status: 'failed',
            endedAt: new Date(),
            message: `content update alert job failed: ${error.message}`,
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) content update alert not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(contentUpdateNotification
.SCHEDULE).join(' ');
    new cron.CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) content update alert initiated successfully!');
})(contentUpdateNotification, config);
