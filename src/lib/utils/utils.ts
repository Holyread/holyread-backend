import crypto from 'crypto'
import jwt from 'jsonwebtoken';
import aws from 'aws-sdk';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import handlebars from 'handlebars'

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
            if (!docContentType) { return reject(new Error('File must be in base64 format')) }
            const base64 = base64Document.indexOf(';base64,')

            let docExtension: string = ''
            let pattern = /^data:image\/\w+;base64,/
            if (base64Document.indexOf('data:video/') > -1) {
                docExtension = base64Document.substring('data:video/'.length, base64Document.indexOf(';base64'))
                pattern = /^data:video\/\w+;base64,/
            } else if (base64Document.indexOf('data:audio/') > -1) {
                docExtension = base64Document.substring('data:audio/'.length, base64Document.indexOf(';base64'))
                pattern = /^data:audio\/\w+;base64,/
            } else if (base64Document.indexOf('data:image/') > -1) {
                docExtension = base64Document.substring('data:image/'.length, base64Document.indexOf(';base64'))
            } else {
                return reject(new Error('File type not supported'))
            }

            docContentType = base64Document.substring('data:'.length, base64)
            const buffer = Buffer.from(base64Document.replace(pattern, ''), 'base64')
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
                if (s3err) reject('Error while uploading file')
                resolve(fileName)
            })
        })
        
    } catch (e: any) {
        console.log('Image Update catch error - > ', e)
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
        s3.deleteObject(option, (s3err, fileData) => {
            if (s3err) { return 'Error while processing file' }
            return true
        })
        return 'File successfully remove from AWS'
    } catch (e: any) {
        throw new Error(e.message)
    }
}

export const sentEmail = async (receiverEmail: string, subject: string, html: string) => {
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
        html
    };
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
    if (value.toString().startsWith('+')) { return value.slice(1) }
    const result = { $regex: '.*' + value.trim() + '.*', $options: '-i' }
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