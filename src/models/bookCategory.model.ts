import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IBookCategory extends mongoose.Document {
    title: string,
    image: string,
    status?: 'Active' | 'DeActive'
}

export type createBookCategoryType = {
    title: string,
    image: string,
    status?: 'Active' | 'DeActive'
}

export type getBookCategoryType = {
    _id?: string,
    title?: string,
    image: string,
    status?: 'Active' | 'DeActive'
}

export const BookCategorySchema = new Schema({
    title: { type: String, required: true, index: true },
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
