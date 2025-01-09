import { CronJob } from 'cron';
import config from '../../config';
import { MeditationModel, CronLogModel, CronScheduleModel } from '../models';
import { cronDirectory } from '../constants/app.constant';

const publishVideo = async (category: string) => {
    try {
        // Find unpublished content for the given category
        const video = await MeditationModel.findOne({ publish: false, category : category })
            .select('_id')
            .lean()
            .exec();

        if (video?._id) {
            await MeditationModel.findOneAndUpdate(
                { _id: video._id },
                { publish: true, publishedAt: new Date() }
            );
            console.log(`Successfully published a video for category: ${category}`);
        } else {
            console.log(`No unpublished videos found for category: ${category}`);
        }
    } catch (error: any) {
        console.error(`Error publishing video for category: ${category} -`, error.message);
        throw error;
    }
};

const start = async () => {
    const cronLog = new CronLogModel({
        jobName: 'meditation',
        status: 'running',
        startedAt: new Date(),
    });
    try {
        console.log('JOB(🟢) meditation started successfully!');

        const today = new Date().getDay();
        if (today === 2) {
            // Tuesday: Publish "Sleep better with Psalms" category
            await publishVideo('6749ece627ea13dbed4bce3b');
        } else if (today === 5) {
            // Friday: Publish "Prayer and Meditation" category
            await publishVideo('6749ed0327ea13dbed4bcec9');
        } else {
            console.log('No scheduled category for today.');
        }

        cronLog.status = 'success';
        console.log('JOB(✅) meditation executed successfully!');
    } catch (error: any) {
        cronLog.status = 'failed';
        cronLog.message = `Execution Error: ${error.message}`;
        console.error('JOB(🔴) meditation execution error:', error.message);
    } finally {
        cronLog.endedAt = new Date();
        await cronLog.save();
    }
};

(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.PUBLISHMEDITATION }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    }
    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) meditation not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { start() }, undefined, true);
    console.log('JOB(🟢) meditation initiated successfully!');
})(config);
