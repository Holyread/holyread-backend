import { CronJob } from 'cron';
import resolveCronSchedule from './cronGuard';
import { ExpertCuratedModel, CronLogModel } from '../models';
import { cronDirectory } from '../constants/app.constant';
import languageService from '../services/admin/language/language.service';

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

    const languages = await languageService.getLanguage({});

    // Find unpublished curated content
    for (const lang of languages) {
      const expertCurateds = await ExpertCuratedModel.findOneAndUpdate(
        { publish: false, language: lang._id },
        { publish: true, publishedAt: new Date() },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!expertCurateds) {
        console.log("No expert curated found for", lang?.name);
        continue;
      }
      console.log(
        "JOB(✅) publish curated executed successfully for!",
        lang?.name
      );
    }

        cronLog.status = "success";
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        console.log('JOB(🔴) publish curated execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'publish_curated',
            status: 'failed',
            endedAt: new Date(),
            message: `publish curated execution Error is: ${error.message}`,
        });
        await cronLog.save();
    }
};

(async () => {
    const schedule = await resolveCronSchedule(
        cronDirectory.PUBLISHCURATEDLIST,
        'publish curated'
    );

    if (!schedule) {
        return;
    }
    new CronJob(schedule, () => { startPublishContentJob() }, undefined, true);
    console.log('JOB(🟢) publish curated initiated successfully!');
})();
