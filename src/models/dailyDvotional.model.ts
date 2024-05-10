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
    category?: string,
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
    category?: string,
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
    category?: string,
}

export const DailyDvotionalSchema = new Schema({
    title: { type: String, index: true, default: '' },
    subTitle: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String },
    video: { type: String },
    status: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
    displayAt: { type: Date },
    category: { type: String },
}, { strict: 'throw' })

export const DailyDvotionalModel = mongoose.model<IDailyDvotional>('dailyDvotional', DailyDvotionalSchema)
