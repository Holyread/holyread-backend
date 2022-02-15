import mongoose, { Schema } from 'mongoose'

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
        required: true,
        ref: 'bookSummary',
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
