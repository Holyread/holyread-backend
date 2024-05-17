import { CronJob } from 'cron';
import config from '../../config';
import { publishDailyDevotional } from '../constants/cron.constants';
import { DailyDvotionalModel, CronLogModel } from '../models';
import { devotionalCategoriesList } from '../constants/app.constant'

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
        let dailyDevotional = [];

        /** Get unpublished daily devotional */
        for (const category of devotionalCategoriesList) {
            const unPublishDevotional = await DailyDvotionalModel.findOne({
                publish: false,
                category: category,
            })
                .select("_id title category")
                .lean()
                .exec();

            if (unPublishDevotional) {
                dailyDevotional.push(unPublishDevotional);
            }
        }
        // Publish the daily devotional
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

((cronConfig, config) => {
    if (cronConfig.JOBRESTRICTENV.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) publish devotional not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(publishDailyDevotional.SCHEDULE).join(' ');
    new CronJob(schedule, () => { startPublishContentJob() }, undefined, true);
    console.log('JOB(🟢) publish devotional initiated successfully!');
})(publishDailyDevotional, config);
