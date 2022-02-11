import mongoose, { Schema } from 'mongoose'
import { BookAuthorModel } from './bookAuthor.model'
import { BookCategoryModel } from './bookCategory.model'
mongoose.set('useCreateIndex', true)

export interface IBookSummary extends mongoose.Document {
    title: string,
    author: string,
    description: string,
    overview: string,
    bookFor: string,
    categories?: [string],
    coverImage?: string,
    coverImageBackground?: string,
    popular?: boolean,
    videoFile?: string,
    audioFile?: string,
    chapters: [{
        name: string,
        description: string,
        audioFile: string
    }],
    status?: 'Active' | 'Deactive'
}

export type createBookSummaryType = {
    title: string,
    author: string,
    description: string,
    overview: string,
    bookFor: string,
    categories?: [string],
    coverImage?: string,
    coverImageBackground?: string,
    popular?: boolean,
    videoFile?: string,
    audioFile?: string,
    chapters: [{
        name: string,
        description: string,
        audioFile: string
    }],
    status?: 'Active' | 'Deactive'
}

export type getBookSummaryType = {
    _id?: string,
    title: string,
    author?: string,
    description?: string,
    overview?: string,
    bookFor?: string,
    categories?: [string],
    coverImage?: string,
    coverImageBackground?: string,
    popular?: boolean,
    videoFile?: string,
    audioFile?: string,
    chapters?: [{
        name: string,
        description: string,
        audioFile: string
    }],
    status?: 'Active' | 'Deactive'
}

export const BookSummarySchema = new Schema({
    title: { type: String, required: true, index: true },
    author: {
        type: Schema.Types.ObjectId,
        ref: BookAuthorModel,
        required: true,
        index: true
    },
    description: { type: String, default: '' },
    overview: { type: String, default: '' },
    bookFor: { type: String, default: '' },
    categories: [{
        type: Schema.Types.ObjectId,
        ref: BookCategoryModel,
        required: true,
        index: true
    }],
    coverImage: { type: String, default: '' },
    coverImageBackground: { type: String },
    popular: { type: Boolean, default: false, index: true },
    audioFile: { type: String },
    videoFile: { type: String },
    chapters: [{
        name: { type: String },
        description: { type: String },
        audioFile: { type: String }
    }],
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    status: { type: String, default: 'Active', index: true },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const BookSummaryModel = mongoose.model<IBookSummary>('bookSummary', BookSummarySchema)
