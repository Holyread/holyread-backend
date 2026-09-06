import config from '../../config';
import { CronScheduleModel } from '../models';

/**
 * Environments in which cron jobs may start at all — decided in code.
 *
 * Every job in this directory has real-world side effects: push
 * notifications and emails to live users, content publishing, profit sync,
 * Stripe coupon mutation. Until now the only thing standing between a
 * developer's machine and all of that was a `jobRestrictEnv` array stored in
 * the database (`CronScheduleModel`). Safety therefore depended on data: a
 * row edited through the admin panel, a row copied between clusters, or a
 * row whose list simply omitted the current environment was enough to start
 * the whole scheduler somewhere it had no business running.
 *
 * This list is the outer check. `jobRestrictEnv` is still honoured, but it
 * now sits on top as configuration and can only narrow what code already
 * permits — it can never widen it.
 *
 * A developer who deliberately needs to exercise a job locally sets
 * NODE_ENV=development (and RUN_CRON=true) rather than relying on whatever
 * the database happens to say.
 */
const cronEnabledEnvironments = ['production', 'development'];

/** True when this process is permitted to run scheduled jobs at all. */
export const cronMayRunHere = (): boolean =>
    config.RUN_CRON && cronEnabledEnvironments.indexOf(config.NODE_ENV) > -1;

/**
 * Resolves the cron expression for a job, or undefined when the job must not
 * start. `label` is the job's own wording, reused in the startup log so the
 * existing log format survives.
 */
const resolveCronSchedule = async (
    jobName: string,
    label: string
): Promise<string | undefined> => {
    if (!cronMayRunHere()) {
        console.log(
            `JOB(🟡) ${label} not initiated: cron is not enabled in `
            + `${config.NODE_ENV} (RUN_CRON=${config.RUN_CRON})`
        );
        return undefined;
    }

    const cronSchedule = await CronScheduleModel
        .findOne({ jobName })
        .lean()
        .exec();

    if (!cronSchedule) {
        console.log(`JOB(🔴) ${label} not found in schedule config`);
        return undefined;
    }

    const restrictedIn = cronSchedule.jobRestrictEnv || [];

    if (restrictedIn.indexOf(config.NODE_ENV) > -1) {
        console.log(
            `JOB(🟡) ${label} not initiated due to ${config.NODE_ENV} Environment`
        );
        return undefined;
    }

    return Object.values(cronSchedule.schedule).join(' ');
};

export default resolveCronSchedule;
