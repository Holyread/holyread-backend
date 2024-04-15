import cron from 'cron';
import config from "../../config";
import { highlightAndQuoteFeature } from '../constants/cron.constants'
import { UserModel, CronLogModel, NotificationsModel, HighLightsModel } from '../models';
import { pushNotification } from '../lib/utils/utils'

const start = async () => {
    try {
        console.log('JOB(🟢) highlight and quote feature started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'highlight_and_quote_feature',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        // Find distinct user IDs from the highlights collection
        const usersWithHighlights = await HighLightsModel.distinct('userId');

        // Find users who are not in the usersWithHighlights array
        const usersWithoutHighlights = await UserModel.find({
            _id: { $nin: usersWithHighlights },
            status: 'Active',
            timeZone: { $exists: true },
            'pushTokens.0': { $exists: true },
            'notification.push': true,
            'notification.userActivityAlerts': true,
        }).select('timeZone pushTokens').lean().exec();

        // Send notifications to matching users
        const notificationsSent = [];
        for (const user of usersWithoutHighlights) {
            const tokens = user.pushTokens.map(token => token.token);
            const notificationPayload = {
                title: '🔔 Notes and highlights!',
                body: `📙 By long pressing on your favorite line, you can make highlights and share them with your friends as quotes or images.`,
            };
            try {
                await pushNotification(tokens, notificationPayload.title, notificationPayload.body);
                notificationsSent.push({
                    userId: user._id,
                    success: true
                });
            } catch (error: any) {
                notificationsSent.push({
                    userId: user._id,
                    success: false,
                    errorMessage: error.message
                });
            }
        }

        // Log Success
        console.log('JOB(✅) highlight and quote feature executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();

        // Log Notifications Sent
        for (const notification of notificationsSent) {
            const notificationLog = new NotificationsModel({
                userId: notification.userId,
                type: 'user',
                notification: {
                    title: '🔔 Notes and highlights!',
                    description: `📙 By long pressing on your favorite line, you can make highlights and share them with your friends as quotes or images .`,
                    success: notification.success,
                    errorMessage: notification.errorMessage,
                },
                createdAt: new Date()
            });
            await notificationLog.save();
        }
    } catch (error: any) {
        // Log Error
        console.log('JOB(🔴) highlight and quote feature execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'highlight_and_quote_feature',
            status: 'failed',
            endedAt: new Date(),
            message: `Highlight and quote feature job failed: ${error.message}`
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) highlight and quote feature not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(highlightAndQuoteFeature.SCHEDULE).join(' ');
    new cron.CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) highlight and quote feature initiated successfully!');
})(highlightAndQuoteFeature, config);
