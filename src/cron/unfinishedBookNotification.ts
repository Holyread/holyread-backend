import { CronJob } from 'cron';
import config from '../../config';
import { BookSummaryModel, UserModel, RatingModel, CronLogModel, NotificationsModel, CronScheduleModel } from '../models';
import { calculateDateInThePast, pushNotification } from '../lib/utils/utils'
import { awsBucket, cronDirectory } from '../constants/app.constant';
import { getNotificationTemplate } from '../lib/helpers/notificationTemplate.helper';
import { NOTIFICATION_TEMPLATE, NOTIFICATION_TEMPLATE_FALLBACKS } from '../constants/notificationTemplate.constant';

const start = async () => {
    try {
        console.log('JOB(🟢) Unfinished book notifier started successfully!');

        let bookDetails;

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'unfinished_book_notifier',
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
        }).select('libraries timeZone pushTokens language').populate('libraries').lean().exec();

        // Filter users based on reading
        const usersRemindUnfinishedBook = users.filter(user =>
            user.libraries && user.libraries.reading && user.libraries.reading.length > 0
        );

        function getRandomBookFromReading(userData) {
            const readingArray = userData.libraries.reading;
            const yesterday = calculateDateInThePast(9);

            // Filter the readingArray to include only books updated yesterday
            const updatedYesterday = readingArray.filter(book => {
                const bookUpdatedDate = new Date(book.updatedAt);
                return bookUpdatedDate < yesterday
            });

            // If there are books updated yesterday, select a random one
            if (updatedYesterday.length > 0) {
                const randomIndex = Math.floor(Math.random() * updatedYesterday.length);
                return updatedYesterday[randomIndex];
            } else {
                // If no books were updated yesterday, select a random book from the entire readingArray
                console.log('JOB(🔴) not found incomplete book from reading list');
            }
        }

        for (const user of usersRemindUnfinishedBook) {
            const randomBook = getRandomBookFromReading(user);

            if (randomBook) {
                const unreadBook: any = await BookSummaryModel.findOne({ _id: randomBook?.bookId }).select([
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

                // get notification Template
                const {title, description} = await getNotificationTemplate(
                    NOTIFICATION_TEMPLATE.unfinishedContent,
                    user?.language,
                    NOTIFICATION_TEMPLATE_FALLBACKS[NOTIFICATION_TEMPLATE.unfinishedContent],
                );

                const notificationDescription = description.replace('{bookTitle}', bookDetails.title)
                const notificationPayload = {
                    title,
                    body: notificationDescription,
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
                            totalStar: bookDetails.bookRating.star,
                            status: bookDetails.status,
                        },
                    },
                };
                try {
                  await pushNotification(
                    tokens,
                    notificationPayload.title,
                    notificationPayload.body,
                    JSON.stringify(notificationPayload.data),
                  );

                  // Log Notifications Sent
                  const notificationLog = new NotificationsModel({
                    userId: user._id,
                    type: "book",
                    notification: {
                      title,
                      description: notificationDescription,
                      bookId: bookDetails?._id,
                      success: true,
                      errorMessage: undefined,
                    },
                    createdAt: new Date(),
                  });
                  await notificationLog.save();
                } catch (error: any) {
                  console.log(
                    "JOB(🔴) Users processing error -",
                    error.message,
                  );
                  const notificationLog = new NotificationsModel({
                    userId: user._id,
                    type: "book",
                    notification: {
                      title,
                      description: notificationDescription,
                      success: false,
                      errorMessage: `Users processing error -', ${error.message}`,
                    },
                    createdAt: new Date(),
                  });
                  await notificationLog.save();
                }
            }
            else {
                console.log('JOB(🔴) not found incomplete book from reading list');
            }
        }
        // Log Success
        console.log('JOB(✅) Unfinished book notifier executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

        
    } catch (error: any) {
        // Log Error
        console.log('JOB(🔴) Unfinished book notifier execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'unfinished_book_notifier',
            status: 'failed',
            endedAt: new Date(),
            message: `Unfinished book notifier job failed: ${error.message}`,
        });
        await cronLog.save();
    }
};

(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.UNFINISHEDBOOKNOTIFICATION }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    } 
    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) Unfinished book notifier not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) Unfinished book notifier initiated successfully!');
})(config);
