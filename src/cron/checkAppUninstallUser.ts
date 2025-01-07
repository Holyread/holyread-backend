import { CronLogModel, CronScheduleModel, UninstallLogModel, UserModel } from "../models";
import firebaseAdmin from 'firebase-admin';
import { CronJob } from 'cron';
import config from '../../config';
import { cronDirectory } from "../constants/app.constant";

const startCheckUninstalledUsersJob = async () => {
    try {
        console.log('JOB(🟢) checking for uninstalled users started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'checking_for_uninstalled_users',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        const users: any[] = await UserModel.find({ "pushTokens.token": { $exists: true, $ne: null } });

        if (!users.length) {
            console.log('JOB(🔴) checking for uninstalled users execution stopped due to no users found');
            cronLog.status = 'failed';
            cronLog.message = 'No users found with push tokens';
            cronLog.endedAt = new Date();
            await cronLog.save();
            return;
        }

        const tokensWithUserIds = users.flatMap(user =>
            user.pushTokens.map(pt => ({ 
                token: pt.token, 
                userId: user._id.toString(), // Ensure userId is a string
                deviceId: pt.deviceId
            }))
        );

        // Function to send notifications in batches of 500
        const sendBatch = async (batch: { token: string; userId: string; deviceId: string }[]) => {
            const tokens = batch.map(twu => twu.token);

            const message = {
                tokens,
                data: {
                    silent: "true"
                }
            };

            const response = await firebaseAdmin.messaging().sendMulticast(message);

            const activeTokens: Set<string> = new Set();

            response.responses.forEach(async (resp, index) => {
                const { token, userId, deviceId } = batch[index];

                if (!resp.success) {
                    const error : any = resp.error;
                    if (error.code === 'messaging/registration-token-not-registered' ||
                        error.code === 'messaging/invalid-registration-token') {

                        // Update the user to set isAppUninstalled to true and remove the push token
                        await UserModel.updateMany(
                            { "pushTokens.token": token },
                            {
                                $pull: { pushTokens: { token } },
                                $set: { isAppUninstalled: true }
                            }
                        );

                        // Log the uninstall or store it for analytics with userId and deviceId
                        await UninstallLogModel.create({ userId: userId as string, deviceId, token, date: new Date() });
                    }
                } else {
                    activeTokens.add(userId as string); // Ensure userId is treated as a string
                }
            });

            // Reset isAppUninstalled flag for users with active tokens
            await UserModel.updateMany(
                { _id: { $in: Array.from(activeTokens) } },
                { $set: { isAppUninstalled: false } }
            );
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
        console.log('JOB(🔴) checking for uninstalled users execution Error: ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'checking_for_uninstalled_users',
            status: 'failed',
            endedAt: new Date(),
            message: `checking_for_uninstalled_users execution Error: ${error.message}`,
        });
        await cronLog.save();
    }
};

(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.CHECKUNINSTALLEDUSER }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    }
    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) checking for uninstalled users not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { startCheckUninstalledUsersJob() }, undefined, true);
    console.log('JOB(🟢) checking for uninstalled users initiated successfully!');
})(config);
