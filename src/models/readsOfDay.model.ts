import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IReadsOfDay extends mongoose.Document {
    title: string,
    subTitle: string,
    description: string,
    image: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
    displayAt: Date
    video?: string,
    contentType?: string
}

export type createReadsOfDayType = {
    title: string,
    subTitle: string,
    description: string,
    image: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
    displayAt: Date,
    video?: string,
    contentType?: string
}

export type getReadsOfDayType = {
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
    contentType?: string
}

export const ReadsOfDaySchema = new Schema({
    title: { type: String, index: true, default: '' },
    subTitle: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String },
    video: { type: String },
    status: { type: String },
    contentType: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
    displayAt: { type: Date }
}, { strict: 'throw' })

export const ReadsOfDayModel = mongoose.model<IReadsOfDay>('readsOfDay', ReadsOfDaySchema)
