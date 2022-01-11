import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IBookSummary extends mongoose.Document {
    title: string,
    author: string,
    description: string,
    overview: string,
    bookFor: string,
    aboutAuthor: string,
    categories?: [string],
    coverImage?: string,
    coverImageBackground?: string,
    videoFile?: string,
    audioFile?: string,
    chapters: [{
        name: string,
        description: string,
        index: number
    }],
    status?: 'Active' | 'DeActive'
}

export type createBookSummaryType = {
    title: string,
    author: string,
    description: string,
    overview: string,
    bookFor: string,
    aboutAuthor: string,
    categories?: [string],
    coverImage?: string,
    coverImageBackground?: string,
    videoFile?: string,
    audioFile?: string,
    chapters: [{
        name: string,
        description: string,
        index: number
    }],
    status?: 'Active' | 'DeActive'
}

export type getBookSummaryType = {
    _id?: string,
    title: string,
    author?: string,
    description?: string,
    overview?: string,
    bookFor?: string,
    aboutAuthor?: string,
    categories?: [string],
    coverImage?: string,
    coverImageBackground?: string,
    videoFile?: string,
    audioFile?: string,
    chapters?: [{
        name: string,
        description: string,
        index: number
    }],
    status?: 'Active' | 'DeActive'
}

export const BookSummarySchema = new Schema({
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    overview: { type: String, default: '' },
    bookFor: { type: String, default: '' },
    aboutAuthor: { type: String, default: '' },
    categories: [{ type: String }],
    coverImage: { type: String, default: '' },
    coverImageBackground: { type: String },
    audioFile: { type: String },
    videoFile: { type: String },
    chapters: [{
        name: String,
        description: String,
        index: Number
    }],
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    status: { type: String, default: 'Active' },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const BookSummaryModel = mongoose.model<IBookSummary>('bookSummary', BookSummarySchema)
