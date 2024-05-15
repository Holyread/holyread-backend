import { CronJob } from 'cron';
import config from '../../config';
import { dailyDevotionalCategoriesNotification } from '../constants/cron.constants';
import { DailyDvotionalModel, SettingModel, UserModel, CronLogModel, NotificationsModel } from '../models';
import { groupByKey, pushNotification } from '../lib/utils/utils';

const start = async () => {
    try {
        console.log('JOB(🟢) Daily devotional categories Started successfully!');

        const cronLog = new CronLogModel({
            jobName: 'daily_devotional_category_notifier',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        // Execution Logic
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const publishedDailyDevotional = await DailyDvotionalModel.find({
            publishedAt: { $gte: new Date(start), $lte: new Date(end) },
        }).select('_id title category').lean().exec();

        // Get users eligible for notifications
        const users: any = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { '$exists': true },
            'notification.dailyDevotional': true,
            'notification.push': true,
            $or: [
                {
                    'inAppSubscription': { $exists: true },
                    'inAppSubscriptionStatus': 'Active',
                },
                {
                    'stripe': { $exists: true },
                    'stripe.status': 'active',
                },
            ],
        }).select('timeZone pushTokens libraries').populate('libraries').lean().exec()

        if (!users.length) {
            console.log(
                "JOB(🔴) Daily devotional categories execution stop due to no users found"
            );
            return;
        }

        const usersWithCategories = users.filter(
            (user) =>
                user.libraries &&
                user.libraries.devotionalCategories &&
                user.libraries.devotionalCategories.length > 0
        );

        // Check if there are eligible users
        if (!usersWithCategories.length) {
            console.log(
                "JOB(🔴) Daily devotional categories execution stop due to no users found"
            );
            return;
        }

        // Group users by timezone
        const result = groupByKey(usersWithCategories, 'timeZone');
        const setting = await SettingModel.findOne({}).select('dailyDevotionalTime').lean().exec();

        Object.keys(result).map(async timeZone => {
            try {
                const dateStr = new Date().toLocaleString('en-US', { timeZone });
                const timeValues = dateStr.split(', ')[1];
                const time = timeValues.split(' ');
                const [hours, minutes] = time[0].split(':');

                const dailyDevotionalTime: any = setting?.dailyDevotionalTime?.split(':') || ['8', '0'];
                let meridian = 'PM';

                if (Number(dailyDevotionalTime[0]) > 12) {
                    meridian = 'PM';
                    dailyDevotionalTime[0] = Number(dailyDevotionalTime[0]) - 12;
                } else if (Number(dailyDevotionalTime[0]) < 12) {
                    meridian = 'AM';
                    if (Number(dailyDevotionalTime[0]) === 0) dailyDevotionalTime[0] = 12;
                }

                if (time[1] === meridian && Number(hours) === Number(dailyDevotionalTime[0]) && Number(minutes) === Number(dailyDevotionalTime[1])) {
                    result[timeZone]?.map(async item => {
                        try {
                            const tokenSet = new Set<string>();
                            item?.pushTokens?.forEach(token => tokenSet.add(token));
                            let userMatchedSeries = []; // Reset matchedSeries for each user
                            publishedDailyDevotional.forEach((devotional) => {
                                if (item.libraries.devotionalCategories.includes(devotional.category)) {
                                    userMatchedSeries.push(devotional.title);
                                }
                            });

                            // Send notifications to users in the timezone
                            const notificationPayload = {
                                title: "🔔 Your daily devotional!",
                                body: `📙 Your daily devotional for ${userMatchedSeries.join(" and ")} are available 🔖`
                            };

                            const tokens: string[] = Array.from(tokenSet);
                            await pushNotification(tokens, notificationPayload.title, notificationPayload.body);

                            // Log notifications sent
                            tokens.forEach(async token => {
                                const notificationLog = new NotificationsModel({
                                    userId: item._id, // Use the correct user ID for each notification
                                    type: 'user',
                                    notification: {
                                        title: notificationPayload.title,
                                        description: notificationPayload.body,
                                        success: true,
                                        errorMessage: undefined,
                                    },
                                    createdAt: new Date(),
                                });
                                await notificationLog.save();
                            });

                            console.log('JOB(✅) Daily devotional categories executed successfully!');
                        } catch (error: any) {
                            console.log('Processing error for user - ', item._id, ':', error.message);
                        }
                    });
                }
            } catch (error :any) {
                console.log('Timezone processing error - ', error.message);
            }
        });
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) Daily devotional execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'daily_devotional_notifier',
            status: 'failed',
            endedAt: new Date(),
            message: `daily devotional job failed: ${error.message}`,
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) Daily devotional not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(dailyDevotionalCategoriesNotification.SCHEDULE).join(' ');
    new CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) Daily devotional initiated successfully!');
})(dailyDevotionalCategoriesNotification, config);
