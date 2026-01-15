import { CronJob } from 'cron';
import config from '../../config';
import { DailyDvotionalModel, CronLogModel, CronScheduleModel } from '../models';
import { cronDirectory } from '../constants/app.constant';
import getDevotionalCategory from '../services/admin/dailyDevotionalCategory/devotionalCategory.service';
import languageService from '../services/admin/language/language.service';

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
    const languages = await languageService.getLanguage({});

    /** Get unpublished general daily devotional */
    for (const lang of languages) {
      const generalDevotional = await DailyDvotionalModel.findOneAndUpdate(
        {
          publish: false,
          language: lang._id,
        },
        {
          publish: true,
          publishedAt: new Date(),
        }
      );

      if (!generalDevotional) {
        console.log(`🔴 No devotional exist for language ${lang?.name}`);
        continue;
      }

      console.log(
        `🟢 Devotional ${generalDevotional?.title} published for lanugage ${lang?.name}`
      );
    }

    /** Get unpublished categories daily devotional */
    const devotionalCategoriesList = await getDevotionalCategory();

    for (const category of devotionalCategoriesList) {
      const devotional = await DailyDvotionalModel.findOneAndUpdate(
        {
          publish: false,
          category: category.name,
        },
        { publish: true, publishedAt: new Date() },
        {
          sort: { createdAt: 1 },
          new: true,
          lean: true,
        }
      );

      if (!devotional) {
        console.log(`No devotional exist for category ${category?.name}`);
        continue;
      }

      console.log("✅ Devotional published for category", category?.name);
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
