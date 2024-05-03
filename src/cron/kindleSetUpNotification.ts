import { CronJob } from 'cron';
import config from '../../config';
import { UserModel, CronLogModel, NotificationsModel } from '../models';
import { calculateDateInThePast, pushNotification } from '../lib/utils/utils'
import { kindleSetUpNotification } from '../constants/cron.constants';

const start = async () => {
    try {
        console.log('JOB(🟢) notify kindle email setup started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'notify_kindle_email_setup',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        const fiveDaysAgo = calculateDateInThePast(5);
        // Find users who are not set up kindle email
        const usersWithoutKindleEmail = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { $exists: true },
            'notification.push': true,
            'notification.userActivityAlerts': true,
            kindleEmail: { $exists: false },
            createdAt: { $lte: fiveDaysAgo },
        }).select('timeZone pushTokens').lean().exec();

        // Send notifications to matching users
        const notificationsSent = [];
        for (const user of usersWithoutKindleEmail) {
            const tokens = user.pushTokens.map(token => token.token);
            const notificationPayload = {
                title: '🔔 Sync your favorite books with your Kindle account for free!',
                body: `📙 Click here to finish setting it up begin reading Holy Reads on your Kindle.`,
            };
            try {
                await pushNotification(tokens, notificationPayload.title, notificationPayload.body);
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
        console.log('JOB(✅) notify kindle email setup executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

        // Log Notifications Sent
        for (const notification of notificationsSent) {
            const notificationLog = new NotificationsModel({
                userId: notification.userId,
                type: 'user',
                notification: {
                    title: '🔔 Sync your favorite books with Kindle!',
                    description: `📙 Click here to finish Kindle setup and start reading Holy Reads collection on Kindle.`,
                    success: notification.success,
                    errorMessage: notification.errorMessage,
                },
                createdAt: new Date(),
            });
            await notificationLog.save();
        }
    } catch (error: any) {
        // Log Error
        console.log('JOB(🔴) notify kindle email setup execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'notify_kindle_email_setup',
            status: 'failed',
            endedAt: new Date(),
            message: `Notify kindle email setup job failed: ${error.message}`,
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) notify kindle email setup not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(kindleSetUpNotification.SCHEDULE).join(' ');
    new CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) notify kindle email setup initiated successfully!');
})(kindleSetUpNotification, config);
