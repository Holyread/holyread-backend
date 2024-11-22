import mongoose, { Schema, Types } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IMeditation extends mongoose.Document {
    _id: string;
    title: string,
    category?: Types.ObjectId,
    image: string,
    video?: string,
    status?: 'Active' | 'Deactive',
    publish?: boolean,
    createdAt: Date,
    updatedAt: Date,
}

export type createMeditationType = {
    title: string,
    category?: Types.ObjectId, 
    image?: string,
    video?: string,
    status?: 'Active' | 'Deactive',
    publish?: boolean,
    createdAt: Date,
    updatedAt: Date,
}


export type getMeditationType = {
    _id: string,
    title: string,
    category: Types.ObjectId,
    video?: string,
    image?: string,
    status?: 'Active' | 'Deactive',
    publish?: boolean,
    createdAt: Date,
    updatedAt: Date,
}

export const MeditationSchema = new Schema({
    title: { type: String, required: true, index: true },
    category: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'meditationCategories' },
    image: { type: String },
    video: { type: String },
    status: { type: String, default: 'Active' },
    publish : { type: Boolean, default: false },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const MeditationModel = mongoose.model<IMeditation>('meditation', MeditationSchema)
