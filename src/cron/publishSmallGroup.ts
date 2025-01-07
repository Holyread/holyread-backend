import { CronJob } from 'cron';
import config from '../../config';
import { SmallGroupModel, CronLogModel, CronScheduleModel } from '../models';
import { cronDirectory } from '../constants/app.constant';

const startPublishContentJob = async () => {
    try {
        console.log('JOB(🟢) small group Started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'small_group',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        // Find unpublish small group content
        const smallGroupList = await SmallGroupModel.find({ publish: false }).select('_id').lean().exec();
        if (smallGroupList.length && smallGroupList[0]?._id) {
            await SmallGroupModel.findOneAndUpdate({ _id: smallGroupList[0]?._id }, { publish: true, publishedAt: new Date() });
        }

        console.log('JOB(✅) small group executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) small group execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'small_group',
            status: 'failed',
            endedAt: new Date(),
            message: `small group execution Error is: ${error.message}`,
        });
        await cronLog.save();
    }
};


(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.PUBLISHSMALLGROUP }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    }
    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) small group not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { startPublishContentJob() }, undefined, true);
    console.log('JOB(🟢) small group initiated successfully!');
})(config);
