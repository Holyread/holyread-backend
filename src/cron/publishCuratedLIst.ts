import cron from 'cron';
import config from "../../config";
import { publishCuratedList } from '../constants/cron.constants';
import { ExpertCuratedModel, CronLogModel } from '../models';


const startPublishContentJob = async () => {
    try {
        console.log('JOB(🟢) publish curated Started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'publish_curated',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        // Find unpublished curated content
        const unpublishCurateds = await ExpertCuratedModel.find({ publish: false }).select('_id').lean().exec();

        // Publish the first unpublished curated content
        if (unpublishCurateds.length && unpublishCurateds[0]?._id) {
            await ExpertCuratedModel.findOneAndUpdate({ _id: unpublishCurateds[0]?._id }, { publish: true, publishedAt: new Date() });
        }

        console.log('JOB(✅) publish curated executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) publish curated execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'publish_curated',
            status: 'failed',
            endedAt: new Date(),
            message: `publish curated execution Error is: ${error.message}`
        });
        await cronLog.save();
    }
};

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) publish curated not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(publishCuratedList.SCHEDULE).join(' ');
    new cron.CronJob(schedule, () => { startPublishContentJob() }, null, true);
    console.log('JOB(🟢) publish curated initiated successfully!');
})(publishCuratedList, config);
