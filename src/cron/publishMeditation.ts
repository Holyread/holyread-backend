import { CronJob } from 'cron';
import config from '../../config';
import { publishMeditation } from '../constants/cron.constants';
import { MeditationModel, CronLogModel } from '../models';

const start = async () => {
    try {
        console.log('JOB(🟢) meditation Started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'meditation',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        // Find unpublish small group content
        const meditationList = await MeditationModel.find({ publish: false }).select('_id').lean().exec();
        if (meditationList.length && meditationList[0]?._id) {
            await MeditationModel.findOneAndUpdate({ _id: meditationList[0]?._id }, { publish: true, publishedAt: new Date() });
        }

        console.log('JOB(✅) meditation executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) meditation execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'meditation',
            status: 'failed',
            endedAt: new Date(),
            message: `meditation execution Error is: ${error.message}`,
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) meditation not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(publishMeditation.SCHEDULE).join(' ');
    new CronJob(schedule, () => { start() }, undefined, true);
    console.log('JOB(🟢) meditation initiated successfully!');
})(publishMeditation, config);
