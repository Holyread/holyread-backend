import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IBookSummary extends mongoose.Document {
    title: string,
    author: string,
    description: string,
    overview: string,
    bookFor: string,
    aboutAuthor: string,
    coverImage: string,
    category: string,
    summaryFile: string,
    audioFiles: [{
        chapterName: string,
        chapterFile: string
    }],
    videoFile: string,
    status?: 'Active' | 'DeActive'
}

export type createBookSummaryType = {
    title: string,
    author: string,
    description: string,
    overview: string,
    bookFor: string,
    aboutAuthor: string,
    coverImage: string,
    category: string,
    summaryFile: string,
    audioFiles: [{
        chapterName: string,
        chapterFile: string
    }],
    videoFile: string,
    status?: 'Active' | 'DeActive'
}

export type getBookSummaryType = {
    _id?: string,
    title: string,
    author: string,
    description: string,
    overview: string,
    bookFor: string,
    aboutAuthor: string,
    coverImage: string,
    category: string,
    summaryFile?: string,
    audioFiles?: [{
        chapterName: string,
        chapterFile: string
    }],
    videoFile?: string,
    status?: 'Active' | 'DeActive'
}

export const BookSummarySchema = new Schema({
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    overview: { type: String, default: '' },
    bookFor: { type: String, default: '' },
    aboutAuthor: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    category: { type: String, required: true },
    summaryFile: { type: String, default: '' },
    audioFiles: [{ type: String }],
    videoFile: { type: String, default: '' },
    status: { type: String, default: 'Active' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const BookSummaryModel = mongoose.model<IBookSummary>('bookSummary', BookSummarySchema)
