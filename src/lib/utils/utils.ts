import crypto from 'crypto'
import jwt from 'jsonwebtoken';
import aws from 'aws-sdk';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';

import config from '../../../config'

const algorithm = 'aes-256-cbc';
const key = '2b7e151628aed2a6abf7158809cf4f3c';
const iv = '3ad77bb40d7a3660';
const inputEncoding = 'utf8';
const outputEncoding = 'base64';

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
    const token: string = jwt.sign(data, 'secret');
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

        let regex = '(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\/]{3}=)?'
        const mimeRegex = '(data:\\w+\\/[a-zA-Z\\+\\-\\.]+;base64,)'

        if (opts.mimeRequired === true) {
            regex = mimeRegex + regex
        } else if (opts.allowMime === true) {
            regex = mimeRegex + '?' + regex
        }

        if (opts.paddingRequired === false) { regex = '(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}(==)?|[A-Za-z0-9+\\/]{3}=?)?' }

        return (new RegExp('^' + regex + '$', 'gi')).test(v)
    } catch (error) {
        throw new Error(error.message)
    }
}

export const uploadImageToAwsS3 = async (
    base64Document: string,
    documentName: string,
    aWSBucket: { region: string, bucketName: string, documentDirectory: string }
) => {
    try {
        return new Promise(async (resolve, reject) => {
            const s3 = new aws.S3({
                secretAccessKey: config.AWS_SECRET,
                accessKeyId: config.AWS_ACCESSKEY,
                region: aWSBucket.region,
            })

            let docContentType: any = await isBase64(base64Document, { allowMime: true })
            if (!docContentType) { return reject(new Error('Image must be in base64 format')) }
            const base64 = base64Document.indexOf(';base64,')

            const docExtension: string = base64Document.substring('data:image/'.length, base64Document.indexOf(';base64'))
            docContentType = base64Document.substring('data:'.length, base64)
            const buffer = Buffer.from(base64Document.replace(/^data:image\/\w+;base64,/, ''), 'base64')
            const regex = / /gi
            const fileName: string = documentName.replace(regex, '-') + '-' + new Date().getTime() + '.' + docExtension

            const option = {
                Key: fileName,
                Body: buffer,
                ContentEncoding: 'base64',
                ContentType: docContentType,
                Bucket: `${aWSBucket.bucketName}/${aWSBucket.documentDirectory}`,
            }

            s3.putObject(option, (s3err, result: any) => {
                if (s3err) reject('Error while uploading image')
                return result
            })

            resolve(fileName)
        })

    } catch (e) {
        throw new Error(e.message)
    }
}

export const removeImageToAwsS3 = async (
    documentName: string,
    aWSBucket: { region: string, bucketName: string, documentDirectory: string }
) => {
    try {
        const s3 = new aws.S3({
            secretAccessKey: config.AWS_SECRET,
            accessKeyId: config.AWS_ACCESSKEY,
            region: aWSBucket.region,
        })

        const option = { Bucket: `${aWSBucket.bucketName}/${aWSBucket.documentDirectory}`, Key: documentName }
        await s3.deleteObject(option, (s3err, fileData) => { if (s3err) { return 'Error while image processing' } return true })
        return 'Image successfully remove from AWS'
    } catch (e) {
        throw new Error(e.message)
    }
}

export const sentEmail = async (receiverEmail: string, subject: string, text: string) => {
    const transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: config.SMTP_EMAIL,
            pass: config.SMTP_SECRET
        }
    }));

    const mailOptions = {
        from: config.SMTP_EMAIL,
        to: receiverEmail,
        subject,
        text
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(false)
            } else {
                resolve(true)
            }
        });
    })
}