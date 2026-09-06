import * as dotenv from 'dotenv';
dotenv.config();

interface IConfig {
    DBURL: string,
    NODE_ENV: string,
    AWS_SECRET: string,
    SMTP_SECRET: string,
    PORT: number | string,
    AWS_ACCESSKEY: string,
    STRIPE_SECRET: string,
    MAILCHIMP_API_KEY: string,
    KINDLE_SMTP_EMAIL: string,
    KINDLE_SMTP_SECRET: string,
    FIREBASE_CLIENT_ID: string,
    FIREBASE_PROJECT_ID: string,
    FIREBASE_PRIVATE_KEY: string,
    FIREBASE_CLIENT_EMAIL: string,
    FIREBASE_PRIVATE_KEY_ID: string,
    RUN_CRON: boolean,
    RUN_STARTUP_SCRIPTS: boolean,
}

/**
 * Boot-time side effects are opt-in per environment.
 *
 * `./scripts` runs write-migrations against whatever DBURL points at, and
 * `./cron` starts ~20 auto-started jobs that email and push-notify real
 * users, publish content and mutate Stripe coupons. Running either from a
 * developer machine pointed at a real database duplicates the deployed
 * scheduler, so they default to on only in the deployed environments.
 *
 * RUN_CRON / RUN_STARTUP_SCRIPTS override the default in either direction.
 */
const deployedEnvironments = ['production', 'development']

const isDeployedEnvironment = deployedEnvironments
    .includes(process.env.NODE_ENV)

const envFlag = (value: string, fallback: boolean): boolean => {
    if (value === undefined || value === '') return fallback
    return value === 'true' || value === '1'
}

const config: IConfig = {
    DBURL: process.env.DBURL,
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV,
    AWS_SECRET: process.env.AWS_SECRET,
    SMTP_SECRET: process.env.SMTP_SECRET,
    AWS_ACCESSKEY: process.env.AWS_ACCESSKEY,
    STRIPE_SECRET: process.env.STRIPE_SECRET,
    MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
    KINDLE_SMTP_EMAIL: process.env.KINDLE_SMTP_EMAIL,
    KINDLE_SMTP_SECRET: process.env.KINDLE_SMTP_SECRET,
    FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
    // Stored with literal "\n" escapes in .env / Elastic Beanstalk env
    // properties, since those cannot hold real newlines.
    FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '')
        .replace(/\\n/g, '\n'),
    RUN_CRON: envFlag(
        process.env.RUN_CRON,
        isDeployedEnvironment
    ),
    RUN_STARTUP_SCRIPTS: envFlag(
        process.env.RUN_STARTUP_SCRIPTS,
        isDeployedEnvironment
    ),
}

export default config
