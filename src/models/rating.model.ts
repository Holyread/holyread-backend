import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IRating extends mongoose.Document {
    description: string,
    star: number,
    userId: string,
    bookId: string
}

export type createRatingType = {
    description: string,
    star: number,
    userId: string,
    bookId: string
}

export type getRatingType = {
    _id?: string,
    description?: string,
    star: number,
    userId: string,
    bookId: string
}

export const RatingSchema = new Schema({
    description: { type: String, default: '' },
    star: {
        type: Number, required: true, index: true, min: [1, 'Rating star should be grater than or equal 1'], max: [5, 'Rating star should be less than or equal 5']
    },
    userId: { type: String, required: true, index: true },
    bookId: { type: String, required: true, index: true },
    updatedAt: { type: Date },
}, { strict: 'throw' })

RatingSchema.index({ userId: -1, star: -1 });
RatingSchema.index({ userId: -1, bookId: -1 });

export const RatingModel = mongoose.model<IRating>('rating', RatingSchema)
