import { CronJob } from 'cron';
import config from '../../config';
import { UserModel, CronLogModel, CronScheduleModel } from '../models';
import { calculateExactDate, compileHtml, sentEmail } from '../lib/utils/utils'
import { cronDirectory, emailTemplatesTitles, originEmails, origins } from '../constants/app.constant';
import emailTemplateService from '../services/admin/emailTemplate/emailTemplate.service';

const NODE_ENV = config.NODE_ENV

const start = async () => {
    try {
        console.log('JOB(🟢) send missionary email to signup users started successfully!');

        // Execution Log
        const cronLog = new CronLogModel({
            jobName: 'send_missionary_email',
            status: 'running',
            startedAt: new Date(),
        });
        await cronLog.save();

        const fiveDaysAgoStart = calculateExactDate(5, 'start');
        const fiveDaysAgoEnd = calculateExactDate(5, 'end');
        // Find users who are not set up kindle email
        const users: any[] = await UserModel.find({
            status: 'Active',
            isSignedUp: true,
            createdAt: { $gte: fiveDaysAgoStart, $lte: fiveDaysAgoEnd },
        }).lean().exec();

        if (!users.length) {
            console.log('JOB(🔴) send missionary email to signup users execution stop due to no users found');
            return;
        }

        // Send email to matching users
        for (const user of users) {
            /** Get welcome email template */
            const emailTemplateDetails =
                await emailTemplateService.getOneEmailTemplateByFilter({
                    title: emailTemplatesTitles.customer.holyReadsMission,
                });
            const subject = emailTemplateDetails?.subject || 'Holy Reads Mission';
            let html

            if (emailTemplateDetails && emailTemplateDetails.content) {
                const contentData = { loginURL: `${origins[NODE_ENV]}/account/login` };
                const htmlData = await compileHtml(
                    emailTemplateDetails.content,
                    contentData
                );
                if (htmlData) {
                    html = htmlData;
                }
            }

            /** sent welcome email */
            await sentEmail({
                from: originEmails.marketing,
                to: user.email,
                subject,
                html,
            });
        }

        // Log Success
        console.log('JOB(✅) send missionary email to signup users setup executed successfully!');
        cronLog.status = 'success';
        cronLog.endedAt = new Date();
        await cronLog.save();
    } catch (error: any) {
        // Log Error
        console.log('JOB(🔴) send missionary email to signup users setup execution Error is - ', error.message);
        const cronLog = new CronLogModel({
            jobName: 'notify_kindle_email_setup',
            status: 'failed',
            endedAt: new Date(),
            message: `Send missionary email to signup users setup job failed: ${error.message}`,
        });
        await cronLog.save();
    }
};

(async (config) => {
    const cronSchedule = await CronScheduleModel.findOne({ jobName: cronDirectory.HOLYREADSMISSIONEMAIL }).lean().exec();

    if (!cronSchedule) {
        console.log('Job not found');
        return;
    }

    if (cronSchedule.jobRestrictEnv.indexOf(config.NODE_ENV) > -1) {
        console.log(`JOB(🟡) send missionary email to signup users setup not initiated due to ${config.NODE_ENV} Environment`);
        return;
    }
    const schedule = Object.values(cronSchedule.schedule).join(' ');
    new CronJob(schedule, () => { start() }, null, true);
    console.log('JOB(🟢) send missionary email to signup users setup initiated successfully!');
})(config);
