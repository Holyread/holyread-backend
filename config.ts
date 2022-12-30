import * as dotenv from 'dotenv';
dotenv.config();

interface IConfig {
    DBURL: string,
    NODE_ENV: string,
    AWS_SECRET: string,
    PORT: number | string,
    AWS_ACCESSKEY: string,
    STRIPE_SECRET: string,
    SMTP_SECRET: string,
    KINDLE_SMTP_EMAIL: string,
    KINDLE_SMTP_SECRET: string,
}

const config: IConfig = {
    DBURL: process.env.DBURL,
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV,
    AWS_SECRET: process.env.AWS_SECRET,
    SMTP_SECRET: process.env.SMTP_SECRET,
    AWS_ACCESSKEY: process.env.AWS_ACCESSKEY,
    STRIPE_SECRET: process.env.STRIPE_SECRET,
    KINDLE_SMTP_EMAIL: process.env.KINDLE_SMTP_EMAIL,
    KINDLE_SMTP_SECRET: process.env.KINDLE_SMTP_SECRET,
}

export default config
