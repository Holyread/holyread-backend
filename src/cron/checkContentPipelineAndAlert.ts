import { cronDirectory, emailTemplatesTitles } from "../constants/app.constant";
import { compileHtml, formattedDate, sentEmail } from "../lib/utils/utils";
import {
  AlertsModel,
  BookSummaryModel,
  CronLogModel,
  CronScheduleModel,
  DailyDvotionalModel,
  ExpertCuratedModel,
} from "../models";
import emailTemplateService from "../services/admin/emailTemplate/emailTemplate.service";
import { CronJob } from 'cron';
import config from '../../config';

const checkContentPipelineAndAlertJob = async () => {
  console.log('JOB(🟢) checking for low content pipeline started successfully!');

  const cronLog = new CronLogModel({
    jobName: 'low_content_pipeline_alert',
    status: 'running',
    startedAt: new Date(),
  });

  try {
    await cronLog.save();

    const devotionalCount = await DailyDvotionalModel.countDocuments({ publish: false });
    const summaryCount = await BookSummaryModel.countDocuments({ publish: false });
    const curatedListsCount = await ExpertCuratedModel.countDocuments({ publish: false });

    const triggeredAt = new Date();
    const alertsToNotify = [];

    const startOfDay = new Date(triggeredAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(triggeredAt);
    endOfDay.setHours(23, 59, 59, 999);

    async function createAlert(type, counts, message) {
      const existingAlert = await AlertsModel.findOne({
        type,
        triggeredAt: { $gte: startOfDay, $lte: endOfDay },
      });

      if (!existingAlert) {
        await AlertsModel.create({
          type,
          ...counts,
          alertMessage: message,
          triggeredAt,
          emailSent: false,
        });
        return true;
      }
      return false;
    }

    // Check each type and collect alerts
    if (devotionalCount < 6) {
      if (await createAlert("devotional", { devotionalCount }, `Low devotional content: Only ${devotionalCount} unpublished devotionals left.`)) {
        alertsToNotify.push(`🕊️ Daily Devotionals Remaining: <strong>${devotionalCount}</strong>`);
      }
    }

    if (summaryCount < 10) {
      if (await createAlert("summary", { summaryCount }, `Low summary content: Only ${summaryCount} unpublished summaries left.`)) {
        alertsToNotify.push(`📖 Book Summaries Remaining: <strong>${summaryCount}</strong>`);
      }
    }

    if (curatedListsCount < 10) {
      if (await createAlert("curatedPosts", { curatedListsCount }, `Low curated list content: Only ${curatedListsCount} unpublished lists left.`)) {
        alertsToNotify.push(`📚 Curated List Posts Remaining: <strong>${curatedListsCount}</strong>`);
      }
    }

    // Only send email if new alerts were created
    if (alertsToNotify.length > 0) {
      const pipelineSummary = alertsToNotify.map((item) => `<li>${item}</li>`).join("\n");

      const pipelineEmailTemplate = await emailTemplateService.getOneEmailTemplateByFilter({
        title: emailTemplatesTitles.admin.contentPipelineReminder,
      });

      const compiledHtml = await compileHtml(pipelineEmailTemplate.content, {
        Team: "Admin",
        today: formattedDate(triggeredAt, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        X: devotionalCount ?? "-",
        Y: summaryCount ?? "-",
        Z: curatedListsCount ?? "-",
        UploadLink: "https://admin.holyreads.com",
        CurrentYear: new Date().getFullYear(),
        PipelineSummary: pipelineSummary,
      });

      await sentEmail({
        from: "noreply@holyreads.com",
        to: "kevin@christianlingua.com, mikhail.iurchuk@gmail.com",
        subject: `📉 [Reminder] Low Content in Pipeline – Devotionals: ${devotionalCount}, Summaries: ${summaryCount}, Lists: ${curatedListsCount}`,
        html: compiledHtml,
      });

      await AlertsModel.updateMany(
        {
          type: { $in: ["devotional", "summary", "curatedPosts"] },
          triggeredAt: { $gte: startOfDay, $lte: endOfDay },
          emailSent: false,
        },
        { $set: { emailSent: true } }
      );

      console.log("JOB(✉️) Low content alert email sent to admins.");
    } else {
      console.log("JOB(ℹ️) No new low content alerts to notify.");
    }

    cronLog.status = 'success';
    cronLog.endedAt = new Date();
    await cronLog.save();
    console.log('JOB(✅) checking for low content pipeline completed successfully!');
  } catch (error: any) {
    console.log('JOB(🔴) checking for low content pipeline execution error:', error.message);

    cronLog.status = 'failed';
    cronLog.endedAt = new Date();
    cronLog.message = `Execution Error: ${error.message}`;
    await cronLog.save();
  }
};

// Cron bootstrap
(async (config) => {
  const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.LOWCONTENTPIPELINEALERT }).lean().exec();

  if (!cronSchedule) {
    console.log('JOB(🔴) Low content pipeline job not found in schedule config.');
    return;
  }

  if (cronSchedule.jobRestrictEnv.includes(config.NODE_ENV)) {
    console.log(`JOB(🟡) Low content pipeline job not initiated due to restricted environment: ${config.NODE_ENV}`);
    return;
  }

  const schedule = Object.values(cronSchedule.schedule).join(' ');

  new CronJob(schedule, () => {
    checkContentPipelineAndAlertJob();
  }, undefined, true);

  console.log('JOB(🟢) Low content pipeline cron initiated successfully!');
})(config);
