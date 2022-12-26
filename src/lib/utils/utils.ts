import aws from 'aws-sdk';
import axios from 'axios';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import handlebars from 'handlebars'
import nodemailer from 'nodemailer';

import firebaseAdmin from 'firebase-admin';
import smtpTransport from 'nodemailer-smtp-transport';
import { awsBucket } from '../../constants/app.constant';

import config from '../../../config'

const algorithm = 'aes-256-cbc';
const iv = '3ad77bb40d7a3660';
const inputEncoding = 'utf8';
const outputEncoding = 'base64';
const key = '2b7e151628aed2a6abf7158809cf4f3c';

const s3 = new aws.S3({
    secretAccessKey: config.AWS_SECRET,
    accessKeyId: config.AWS_ACCESSKEY,
    region: awsBucket.region,
})

export const encrypt = (text: string): string => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, inputEncoding, outputEncoding)
    encrypted += cipher.final(outputEncoding);
    return encrypted;
}

export const decrypt = (encrypted: string): string => {
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let dec = decipher.update(encrypted, outputEncoding, inputEncoding)
    dec += decipher.final(inputEncoding);
    return dec;
}

export const getToken = (data: { [key: string]: string }) => {
    const token: string = jwt.sign(data, 'secret', { expiresIn: '7d' }); // token valid for 7 days
    return token
}

export const verifyToken = (token: string) => {
    const decoded = jwt.verify(token, 'secret');
    return decoded
}

export const isBase64 = async (v: any, opts: any) => {
    try {
        if (v instanceof Boolean || typeof v === 'boolean') { return false }

        if (!(opts instanceof Object)) { opts = {} }

        if (opts.allowEmpty === false && v === '') { return false }

        let regex = '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'
        const mimeRegex = '(data:\\w+\\/[a-zA-Z\\+\\-\\.]+;base64,)'

        if (opts.mimeRequired === true) {
            regex = mimeRegex + regex
        } else if (opts.allowMime === true) {
            regex = mimeRegex + '?' + regex
        }

        if (opts.paddingRequired === false) { regex = '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$' }

        // return (new RegExp('^' + regex + '$', 'gi')).test(v)
        return true
    } catch (error: any) {
        throw new Error(error.message)
    }
}

export const uploadFileToS3 = async (
    base64Document: string,
    documentName: string,
    aWSBucket: { region: string, bucketName: string, documentDirectory: string }
) => {
    try {
        return new Promise(async (resolve, reject) => {
            let docContentType: any = await isBase64(base64Document, { allowMime: true })
            if (!docContentType) { return reject(new Error('File must be in base64 format')) }
            const base64 = base64Document.indexOf(';base64,')

            let docExtension: string = ''
            let pattern: any = /^data:image\/\w+;base64,/
            if (base64Document.indexOf('data:video/') > -1) {
                docExtension = base64Document.substring('data:video/'.length, base64Document.indexOf(';base64'))
                pattern = /^data:video\/\w+;base64,/
            } else if (base64Document.indexOf('data:audio/') > -1) {
                docExtension = base64Document.substring('data:audio/'.length, base64Document.indexOf(';base64'))
                pattern = /^data:audio\/\w+;base64,/
            } else if (base64Document.indexOf('data:application/epub+zip') > -1) {
                docExtension = base64Document.substring('data:application/'.length, base64Document.indexOf('+zip;base64'));
                pattern = 'data:application/epub+zip;base64,'

            } else if (base64Document.indexOf('data:application/') > -1) {
                docExtension = base64Document.substring('data:application/'.length, base64Document.indexOf(';base64'))
                pattern = /^data:application\/\w+;base64,/
            } else if (base64Document.indexOf('data:image/') > -1) {
                docExtension = base64Document.substring('data:image/'.length, base64Document.indexOf(';base64'))
            }
            else {
                return reject(new Error('File type not supported'))
            }

            docContentType = base64Document.substring('data:'.length, base64)
            const buffer = Buffer.from(base64Document.replace(pattern, ''), 'base64')
            const regex = /[^A-Z0-9]+/ig
            const name: string = documentName.replace(regex, '_') + '_' + new Date().getTime() + '.' + docExtension
            const option = {
                Key: name,
                Body: buffer,
                ContentEncoding: 'base64',
                ContentType: docContentType,
                Bucket: `${aWSBucket.bucketName}/${aWSBucket.documentDirectory}`,
            }
            s3.putObject(option, (s3err, result: any) => {
                if (s3err) reject('Error while uploading file')
                const size = Buffer.byteLength(buffer)
                resolve({ name, size })
            })
        })
    } catch (e: any) {
        throw new Error(e.message)
    }
}

export const removeS3File = async (
    documentName: string,
    aWSBucket: { region: string, bucketName: string, documentDirectory: string }
) => {
    try {
        const option = { Bucket: `${aWSBucket.bucketName}/${aWSBucket.documentDirectory}`, Key: documentName }
        s3.deleteObject(option, (s3err, fileData) => {
            if (s3err) { return 'Error while processing file' }
            return true
        })
        return 'File successfully remove from AWS'
    } catch (e: any) {
        throw new Error(e.message)
    }
}

export const sentEmail = async (receiverEmail: string, subject: string, html: string, fileName?: string, fileLink?: string, sentToKindle?: any) => {
    const transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: sentToKindle ? config.KINDLE_SMTP_EMAIL : config.SMTP_EMAIL,
            pass: sentToKindle ? config.KINDLE_SMTP_SECRET : config.SMTP_SECRET
        }
    }));

    const mailOptions: any = {
        from: sentToKindle ? config.KINDLE_SMTP_EMAIL : config.SMTP_EMAIL,
        to: receiverEmail,
        subject,
        headers: {
            "X-Laziness-level": 1000,
            "charset": 'UTF-8'
        },
        html,
    };
    if (fileLink) {
        mailOptions.attachments = [{
            fileName,
            path: fileLink,
            contentType: 'application/pdf',
        }]
    }
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message)
                reject(false)
            } else {
                resolve(true)
            }
        });
    })
}

export const getSearchRegexp = async (value) => {
    const result = { $regex: `.*` + value.toLowerCase().trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '.*', $options: '-i' }
    return result
}

export const compileHtml = async (source: string, data: any) => {
    try {
        const template = handlebars.compile(source);
        const result = template(data);
        return result
    } catch (e) {
        return null
    }
}

export const randomNumberInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

export const pushNotification = async (tokens: string[], title: string, description: string, args = "") => {
    firebaseAdmin.messaging().sendToDevice(
        tokens, {
        notification: {
            title,
            body: description,
        },
        data: {
            info: args
        }
    }).then(response => {
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', error);
            } else {
                console.log('Sucessfully sent Notification to', result);
            }
        });
    })
}

/** Sort an array object */
export const sortArrayObject = (list: [object], key: string, order: 'asc' | 'desc') => {
    return list.sort((a, b) => {
        if (['updatedAt', 'createdAt'].includes(key)) {
            if (new Date(a[key]).getTime() < new Date(b[key]).getTime()) {
                return order === 'asc' ? -1 : 1;
            }
            if (new Date(a[key]).getTime() > new Date(b[key]).getTime()) {
                return order === 'desc' ? -1 : 1;
            }
            return 0;
        } else {
            if (a[key] < b[key]) {
                return order === 'asc' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return order === 'desc' ? -1 : 1;
            }
            return 0;
        }
    })
}

export const getTimeDiff = (from: string, to: string) => {
    const timeDiff = new Date(to).getTime() - new Date(from).getTime()
    let seconds = Math.floor(timeDiff / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    hours = hours - (days * 24);
    minutes = minutes - (days * 24 * 60) - (hours * 60);
    seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
    return days < 0 ? '0:0:0:0' : `${days}:${hours}:${minutes}:${seconds}`;
}

export const getDates = (d1: any, d2: any) => {
    const oneDay = 24 * 3600 * 1000;
    for (var d = [], ms = d1 * 1, last = d2 * 1; ms < last; ms += oneDay) {
        d.push(new Date(ms));
    }
    return d;
}

export const groupByKey = (list: any, key: string) =>
    list.reduce((hash, obj) =>
        ({ ...hash, [obj[key]]: (hash[obj[key]] || []).concat(obj) }), {})

export const decodeHTMLEntities = (text: string) => {
    const entities = [
        ['amp', '&'],
        ['apos', '\''],
        ['#x27', '\''],
        ['#x2F', '/'],
        ['#39', '\''],
        ['#47', '/'],
        ['lt', '<'],
        ['gt', '>'],
        ['nbsp', ' '],
        ['quot', '"'],
        ['&nbsp;', ' ']
    ];

    for (var i = 0, max = entities.length; i < max; ++i)
        text = text.replace(new RegExp('&' + entities[i][0] + ';', 'g'), entities[i][1]);

    return text;
}

export const imageUrlToBase64 = async (imageUrl: string) => {
    try {
        const { headers, data } = await axios.get(
            imageUrl,
            { responseType: 'arraybuffer' }
        )
        return "data:" + headers["content-type"] + ";base64," + Buffer.from(data).toString('base64');
    } catch ({ message }) {
        return null;
    }
}

export const formattedDate = (
    date: Date,
    format?: {
        day: any,
        month: any,
        year: any
    }) => {
    return date
        .toLocaleDateString(
            'en-GB',
            format
                ? format
                : {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }
        )
};

export const copyS3File = async ({
    oldKey,
    newKey,
    bucketName
}: {
    oldKey: string,
    newKey: string,
    bucketName: string
}) => {
    try {
        /* Copy the object to a new location */
        const result = await s3.copyObject({
            Key: newKey,
            Bucket: bucketName,
            CopySource: oldKey,
        }).promise()

        return result
    } catch ({ message }) {
        throw new Error(message as string)
    }
}