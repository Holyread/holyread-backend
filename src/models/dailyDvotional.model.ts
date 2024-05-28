import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IDailyDvotional extends mongoose.Document {
    title: string,
    subTitle: string,
    description: string,
    image: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
    displayAt: Date
    video?: string,
    audio?: string,
    category?: string,
    publish : boolean,
    publishedAt : Date,
    videoFileSize?: number,
    audioFileSize?: number,
}

export type createDailyDvotionalType = {
    title: string,
    subTitle: string,
    description: string,
    image: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
    displayAt: Date,
    video?: string,
    audio?: string,
    category?: string,
    publish : boolean,
    publishedAt : Date,
    videoFileSize?: number,
    audioFileSize?: number,
}


export type getDailyDvotionalType = {
    _id?: string,
    title?: string,
    subTitle?: string,
    description?: string,
    image?: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
    displayAt: Date,
    video?: string,
    audio?: string,
    category?: string,
    publish : boolean,
    publishedAt : Date,
    videoFileSize?: number,
    audioFileSize?: number,
}

export const DailyDvotionalSchema = new Schema({
    title: { type: String, index: true, default: '' },
    subTitle: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String },
    video: { type: String },
    audio: { type: String },
    status: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
    displayAt: { type: Date },
    publishedAt : { type: Date },
    category: { type: String },
    audioFileSize: { type: Number },
    videoFileSize: { type: Number },
    publish : { type : Boolean, default: false },
}, { strict: 'throw' })

export const DailyDvotionalModel = mongoose.model<IDailyDvotional>('dailyDvotional', DailyDvotionalSchema)
