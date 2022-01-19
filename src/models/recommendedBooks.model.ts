import mongoose, { Schema } from 'mongoose'
import { BookSummaryModel } from './bookSummary.model'

mongoose.set('useCreateIndex', true)

export interface IRecommendedBook extends mongoose.Document {
    book: string
}

export type createRecommendedBookType = {
    book: string
}

export type getRecommendedBookType = {
    _id?: string,
    book?: string
}

export const RecommendedBookSchema = new Schema({
    book: {
        type: Schema.Types.ObjectId,
        ref: BookSummaryModel,
        required: true,
        index: true
    },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const RecommendedBookModel = mongoose.model<IRecommendedBook>('recommendedBook', RecommendedBookSchema)
