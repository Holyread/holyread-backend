import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IBookCategory extends mongoose.Document {
    title: string,
    shortDescription?: string,
    image: string,
    status?: 'Active' | 'Deactive'
}

export type createBookCategoryType = {
    title: string,
    shortDescription?: string,
    image: string,
    status?: 'Active' | 'Deactive'
}

export type getBookCategoryType = {
    _id?: string,
    title?: string,
    shortDescription?: string,
    image: string,
    status?: 'Active' | 'Deactive'
}

export const BookCategorySchema = new Schema({
    title: { type: String, required: true, index: true },
    shortDescription: { type: String, default: '' },
    image: { type: String, required: true },
    status: { type: String, required: true, index: true },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const BookCategoryModel = mongoose.model<IBookCategory>('bookCategory', BookCategorySchema)
