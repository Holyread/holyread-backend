import { CronLogModel, UninstallLogModel, UserModel } from "../models";
import firebaseAdmin from 'firebase-admin';
import { CronJob } from 'cron';
import config from '../../config';
import { checkUninstalledUser } from '../constants/cron.constants';

const startCheckUninstalledUsersJob = async () => {
    try {
        console.log('JOB(🟢) checking for uninstalled users successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'checking_for_uninstalled_users',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();
        const users = await UserModel.find({ "pushTokens.token": { $exists: true, $ne: null } });

        if (!users.length) {
            console.log('JOB(🔴) checking for uninstalled users execution stop due to no users found');
        }
        const tokensWithUserIds = users.flatMap(user =>
            user.pushTokens.map(pt => ({ token: pt.token, userId: user._id }))
        );

        // Function to send notifications in batches of 500
        const sendBatch = async (batch: { token: string; userId: string }[]) => {
            const tokens = batch.map(twu => twu.token);

            const message = {
                tokens,
                data: {
                    silent: "true"
                }
            };

            const response = await firebaseAdmin.messaging().sendMulticast(message);

            response.responses.forEach(async (resp, index) => {
                if (!resp.success) {
                    const error = resp.error;
                    if (error.code === 'messaging/registration-token-not-registered' ||
                        error.code === 'messaging/invalid-registration-token') {

                        const { token, userId } = batch[index];
                        await UserModel.updateMany({ "pushTokens.token": token }, { $pull: { pushTokens: { token } } });

                        // Log the uninstall or store it for analytics with userId
                        await UninstallLogModel.create({ userId, token, date: new Date() });
                    }
                }
            });
        };

        // Batch the tokens into groups of 500
        const batchSize = 500;
        for (let i = 0; i < tokensWithUserIds.length; i += batchSize) {
            const batch = tokensWithUserIds.slice(i, i + batchSize);
            await sendBatch(batch);
        }
        console.log('JOB(✅) checking for uninstalled users executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) checking for uninstalled users execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'checking_for_uninstalled_users',
            status: 'failed',
            endedAt: new Date(),
            message: `checking_for_uninstalled_users execution Error is: ${error.message}`,
        });
        await cronLog.save();
    }
}

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) checking for uninstalled users not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(checkUninstalledUser.SCHEDULE).join(' ');
    new CronJob(schedule, () => { startCheckUninstalledUsersJob() }, undefined, true);
    console.log('JOB(🟢) checking for uninstalled users initiated successfully!');
})(checkUninstalledUser, config);
