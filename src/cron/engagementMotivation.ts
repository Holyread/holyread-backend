import cron from 'cron';
import config from "../../config";
import { engagementMotivation } from '../constants/cron.constants';
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel } from '../models';
import { pushNotification, calculateDateInThePast } from '../lib/utils/utils';
import { awsBucket } from '../constants/app.constant';

const startEngagementMotivationJob = async () => {
    try {
        console.log('JOB(🟢) engagement motivation Started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'engagement_motivation',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        const books = await BookSummaryModel.find({ publish: true }).select('_id').lean().exec();

        function getRandomBook(bookData) {
            const bookArray = bookData;
            const randomIndex = Math.floor(Math.random() * bookArray.length);
            return bookArray[randomIndex];
        }

        const randomBook = getRandomBook(books);

        // Find a new published book for today
        const newPublishBook = await BookSummaryModel.findOne({ _id: randomBook._id }).select([
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
        ]).populate('author').lean().exec();

        if (!newPublishBook) {
            console.log('JOB(🔴) engagement motivation execution stop due to no new published book found');
            return;
        }

        // Get the book rating
        const bookRating = await RatingModel.findOne({ bookId: newPublishBook._id }).select('star').lean().exec();
        const publishContent = { ...newPublishBook, bookRating };

        // Calculate the date three days ago
        const threeDaysAgo = calculateDateInThePast(3);

        // Find active users with a defined timeZone, at least one push token,
        // enabled push notifications, and whose lastSeen date is on or before three days ago
        const users = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { $exists: true },
            'notification.push': true,
            'notification.userActivityAlerts': true,
            lastSeen: { $lte: threeDaysAgo }
        }).select('pushTokens').lean().exec();

        if (!users.length) {
            console.log('JOB(🔴) engagement motivation execution stop due to no users found');
            return;
        }

        // Send notifications to each user
        for (const user of users) {
            const tokens = user.pushTokens.map(token => token.token);
            try {
                await pushNotification(
                    tokens,
                    '🔔 We miss you at Holy Reads!',
                    `📙 You've missed out on some uplifting content like ${publishContent.title}.`,
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
                        title: '🔔 We miss you at Holy Reads!',
                        description: `📙 You've missed out on some uplifting content like ${publishContent.title}.`,
                        success: true,
                        errorMessage: null,
                    },
                    createdAt: new Date()
                });
                await notificationLog.save();
            } catch (error: any) {
                console.log('JOB(🔴) Users processing error -', error.message);
                const notificationLog = new NotificationsModel({
                    userId: user._id,
                    type: 'user',
                    notification: {
                        title: '🔔 We miss you at Holy Reads!',
                        description: `📙 You've missed out on some uplifting content like ${publishContent.title}.`,
                        success: false,
                        errorMessage: `Users processing error -', ${error.message}`,
                    },
                    createdAt: new Date()
                });
                await notificationLog.save();
            }
        }

        console.log('JOB(✅) engagement motivation executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) engagement motivation execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'engagement_motivation',
            status: 'failed',
            endedAt: new Date(),
            message: `engagement motivation execution Error is: ${error.message}`
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) engagement motivation not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(engagementMotivation.SCHEDULE).join(' ');
    new cron.CronJob(schedule, () => { startEngagementMotivationJob() }, null, true);
    console.log('JOB(🟢) engagement motivation initiated successfully!');
})(engagementMotivation, config);
