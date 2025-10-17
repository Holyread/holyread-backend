import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IBookAuthor extends mongoose.Document {
    name: string,
    about: string
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type createBookAuthorType = {
    name: string,
    about: string
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type getBookAuthorType = {
    _id?: string,
    name?: string,
    about?: string
    language?: {type: Schema.Types.ObjectId, ref: 'language'}
}

export const BookAuthorSchema = new Schema({
    name: { type: String, required: true, index: true },
    about: { type: String, required: true, index: true },
    language: {type: Schema.Types.ObjectId, ref: 'language'},
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const BookAuthorModel = mongoose.model<IBookAuthor>('bookAuthor', BookAuthorSchema)
