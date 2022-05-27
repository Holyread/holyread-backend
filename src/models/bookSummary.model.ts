import mongoose, { Schema } from 'mongoose'
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
    videoFileSize?: number,
    bookReadFile?: string,
    chapters: [{
        name: string,
        description: string,
        audioFile: string,
        size: number
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
    videoFileSize?: number,
    bookReadFile?: string,
    chapters: [{
        name: string,
        description: string,
        audioFile: string,
        size: number
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
    videoFileSize?: number,
    bookReadFile?: string,
    chapters?: [{
        name: string,
        description: string,
        audioFile: string,
        size: number
    }],
    status?: 'Active' | 'Deactive'
}

export const BookSummarySchema = new Schema({
    title: { type: String, required: true, index: true },
    author: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'bookAuthor',
        index: true
    },
    description: { type: String, default: '' },
    overview: { type: String, default: '' },
    bookFor: { type: String, default: '' },
    categories: [{
        type: Schema.Types.ObjectId,
        ref: 'bookCategory',
        required: true
    }],
    coverImage: { type: String, default: '' },
    coverImageBackground: { type: String },
    popular: { type: Boolean, default: false, index: true },
    videoFile: { type: String },
    videoFileSize: { type: Number },
    bookReadFile: { type: String },
    chapters: [{
        name: { type: String },
        description: { type: String },
        audioFile: { type: String },
        size: { type: Number }
    }],
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    status: { type: String, default: 'Active', index: true },
    updatedAt: { type: Date },
}, { strict: 'throw' })

BookSummarySchema.index({ categories: -1 });
BookSummarySchema.index({ title: -1, status: -1 });
BookSummarySchema.index({ overview: -1, status: -1 });
BookSummarySchema.index({ bookFor: -1, status: -1 });

export const BookSummaryModel = mongoose.model<IBookSummary>('bookSummary', BookSummarySchema)
