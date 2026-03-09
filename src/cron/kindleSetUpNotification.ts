import { CronJob } from 'cron';
import config from '../../config';
import { UserModel, CronLogModel, NotificationsModel, CronScheduleModel } from '../models';
import { calculateDateInThePast, pushNotification } from '../lib/utils/utils'
import { cronDirectory } from '../constants/app.constant';
import { getNotificationTemplate } from '../lib/helpers/notificationTemplate.helper';
import { NOTIFICATION_TEMPLATE, NOTIFICATION_TEMPLATE_FALLBACKS } from '../constants/notificationTemplate.constant';

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
        const usersWithoutKindleEmail: any[] = await UserModel.find({
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { $exists: true },
            'notification.push': true,
            'notification.userActivityAlerts': true,
            kindleEmail: { $exists: false },
            createdAt: { $lte: fiveDaysAgo },
        }).select('timeZone pushTokens language').lean().exec();

        // Send notifications to matching users
        for (const user of usersWithoutKindleEmail) {
            const tokens = user.pushTokens.map(token => token.token);

            // get notification
            const { title, description } = await getNotificationTemplate(
              NOTIFICATION_TEMPLATE.kindleSync,
              user.language,
              NOTIFICATION_TEMPLATE_FALLBACKS[NOTIFICATION_TEMPLATE.kindleSync],
            );
            const notificationPayload = {
                title,
                body: description
            };
            try {
                await pushNotification(tokens, notificationPayload.title, notificationPayload.body);
                const notificationLog = new NotificationsModel({
                    userId: user._id,
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
            } catch (error: any) {
                console.log('JOB(🔴) Users processing error -', error.message);
                const notificationLog = new NotificationsModel({
                    userId: user._id,
                    type: 'user',
                    notification: {
                        title: notificationPayload.title,
                        description: notificationPayload.body,
                        success: false,
                        errorMessage: `Users processing error -', ${error.message}`,
                    },
                    createdAt: new Date(),
                });
                await notificationLog.save();
            }
        }

        // Log Success
        console.log('JOB(✅) notify kindle email setup executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

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

(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.KINDLESETUPNOTIFICATION }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    }
    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) notify kindle email setup not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) notify kindle email setup initiated successfully!');
})(config);
