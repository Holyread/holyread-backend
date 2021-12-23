import * as dotenv from 'dotenv';
dotenv.config();

interface IConfig {
    PORT: number,
    DBURL: string,
    NODE_ENV: string,
    AWS_SECRET: string,
    AWS_ACCESSKEY: string,
    SMTP_EMAIL: string,
    SMTP_SECRET: string
}

const config: IConfig = {
    PORT: 5000,
    DBURL: process.env.DBURL,
    NODE_ENV: process.env.NODE_ENV,
    AWS_SECRET: process.env.AWS_SECRET,
    AWS_ACCESSKEY: process.env.AWS_ACCESSKEY,
    SMTP_EMAIL: process.env.SMTP_EMAIL,
    SMTP_SECRET: process.env.SMTP_SECRET,
}

export default config
