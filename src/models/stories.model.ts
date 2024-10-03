import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IStories extends mongoose.Document {
    title: string,
    category?: string,
    image: string,
    video?: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
}

export type createStoriesType = {
    title: string,
    category?: string, 
    image?: string,
    video?: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
}


export type getStoriesType = {
    _id?: string,
    title: string,
    category: { type: String },
    video?: string,
    image?: string,
    status?: 'Active' | 'Deactive',
    createdAt: Date,
    updatedAt: Date,
}

export const StoriesSchema = new Schema({
    title: { type: String, required: true, index: true },
    category: { type: String },
    image: { type: String },
    video: { type: String },
    status: { type: String, default: 'Active' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const StoriesModel = mongoose.model<IStories>('stories', StoriesSchema)
