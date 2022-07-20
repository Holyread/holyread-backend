import * as dotenv from 'dotenv';
dotenv.config();

interface IConfig {
    PORT: number | string,
    DBURL: string,
    NODE_ENV: string,
    AWS_SECRET: string,
    AWS_ACCESSKEY: string,
    SMTP_EMAIL: string,
    SMTP_SECRET: string,
    KINDLE_SMTP_EMAIL: string,
    KINDLE_SMTP_SECRET: string,
    STRIPE_SECRET: string,
}

const config: IConfig = {
    PORT: process.env.PORT || 5000,
    DBURL: process.env.DBURL,
    NODE_ENV: process.env.NODE_ENV,
    AWS_SECRET: process.env.AWS_SECRET,
    AWS_ACCESSKEY: process.env.AWS_ACCESSKEY,
    SMTP_EMAIL: process.env.SMTP_EMAIL,
    SMTP_SECRET: process.env.SMTP_SECRET,
    KINDLE_SMTP_EMAIL: process.env.KINDLE_SMTP_EMAIL,
    KINDLE_SMTP_SECRET: process.env.KINDLE_SMTP_SECRET,
    STRIPE_SECRET: process.env.STRIPE_SECRET,
}

export default config
