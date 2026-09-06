import { CronJob } from "cron";
import resolveCronSchedule from './cronGuard';
import { SmallGroupModel, CronLogModel } from "../models";
import { cronDirectory } from '../constants/app.constant';
import languageService from "../services/admin/language/language.service";

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

        const language = await languageService.getLanguage({});
    // Find unpublish small group content
    for (const lang of language) {
      const smallGroup = await SmallGroupModel.findOneAndUpdate(
        { publish: false, language: lang._id },
        { publish: true, publishedAt: new Date() },
        { sort: { createdAt: 1}, new: true }
      );

      if (!smallGroup) {
        console.log(
          "🔴 No unpublished small group found for language",
          lang?.name
        );
        continue;
      }

      console.log(
        "🟢 Small Group published for language",
        lang?.name,
        smallGroup?.title
      );
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


(async () => {
    const schedule = await resolveCronSchedule(
        cronDirectory.PUBLISHSMALLGROUP,
        'small group'
    );

    if (!schedule) {
        return;
    }
    new CronJob(schedule, () => { startPublishContentJob() }, undefined, true);
    console.log('JOB(🟢) small group initiated successfully!');
})();
