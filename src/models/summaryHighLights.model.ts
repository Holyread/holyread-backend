import mongoose, { Schema } from 'mongoose'
mongoose.set('useCreateIndex', true)

export interface IBookSummary extends mongoose.Document {
    summaryId: string,
    chapterId: string,
    highLights: [{
        color: string,
        startIndex: number,
        endIndex: number
    }],
    status?: 'Active' | 'Deactive'
}

export type createBookSummaryType = {
    summaryId: string,
    chapterId: string,
    highLights: [{
        color: string,
        startIndex: number,
        endIndex: number
    }],
    status?: 'Active' | 'Deactive'
}

export type getBookSummaryType = {
    _id?: string,
    summaryId: string,
    chapterId: string,
    highLights: [{
        color: string,
        startIndex: number,
        endIndex: number
    }],
    status?: 'Active' | 'Deactive'
}

export const BookSummarySchema = new Schema({
    summaryId: { type: String },
    chapterId: { type: String },
    highLights: [{
        color: { type: String },
        startIndex: { type: Number },
        endIndex: { type: Number }
    }],
    status: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const BookSummaryModel = mongoose.model<IBookSummary>('bookSummary', BookSummarySchema)
