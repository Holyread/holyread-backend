import { CronJob } from 'cron';
import config from '../../config';
import { DailyDvotionalModel, CronLogModel, CronScheduleModel } from '../models';
import { devotionalCategoriesList } from '../lib/utils/utils';
import { cronDirectory } from '../constants/app.constant';

const startPublishContentJob = async () => {
    try {
        console.log('JOB(🟢) publish devotional Started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'publish devotional',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();
        let dailyDevotional : any = [];

        /** Get unpublished general daily devotional */
        const unPublishGeneralDevotional = await DailyDvotionalModel.find({ publish: false }).select('_id').lean().exec();

        if (unPublishGeneralDevotional.length) {
            await DailyDvotionalModel.findOneAndUpdate({ _id: unPublishGeneralDevotional[0]?._id }, { publish: true, publishedAt: new Date() });
        }

        /** Get unpublished categories daily devotional */
        for (const category of devotionalCategoriesList) {
            const unPublishDevotional: any = await DailyDvotionalModel.findOne({
                publish: false,
                category: category.name,
            })
                .sort({ createdAt: 1 })
                .select("_id title category createdAt")
                .lean()
                .exec();

            if (unPublishDevotional) {
                dailyDevotional.push(unPublishDevotional);
            }
        }
        // Publish the  categories daily devotional
        if (dailyDevotional.length) {
            await Promise.all(
                dailyDevotional.map(async (item) => {
                    await DailyDvotionalModel.findOneAndUpdate(
                        { _id: item?._id },
                        { publish: true, publishedAt: new Date() }
                    );
                    return item;
                })
            );
        }
        console.log('JOB(✅) publish devotional executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) publish devotional execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'publish devotional',
            status: 'failed',
            endedAt: new Date(),
            message: `publish devotional execution Error is: ${error.message}`,
        });
        await cronLog.save();
    }
};

(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.PUBLISHDAILYDEVOTIONAL }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    }
    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) publish devotional not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { startPublishContentJob() }, undefined, true);
    console.log('JOB(🟢) publish devotional initiated successfully!');
})(config);
