import mongoose, { Schema, Types } from 'mongoose'

export interface IUserLibrary extends mongoose.Document {
    saved?: [Types.ObjectId],
    completed?: [Types.ObjectId],
    view?: [{
        bookId: Types.ObjectId,
        createdAt: Date
    }],
    smallGroups?: [Types.ObjectId]
    reading?: [{
        bookId: Types.ObjectId,
        updatedAt: Date,
        chaptersCompleted: [string],
    }],
}

export type createUserLibraryType = {
    saved?: [Types.ObjectId],
    completed?: [Types.ObjectId],
    view?: [{
        bookId: Types.ObjectId,
        createdAt: Date
    }],
    smallGroups?: [Types.ObjectId]
    reading?: [{
        bookId: Types.ObjectId,
        updatedAt: Date,
        chaptersCompleted: [string],
    }],
}

export type getUserLibraryType = {
    _id?: Types.ObjectId,
    saved?: [Types.ObjectId],
    completed?: [Types.ObjectId],
    view?: [{
        bookId: Types.ObjectId,
        createdAt: Date
    }],
    smallGroups?: [Types.ObjectId]
    reading?: [{
        bookId: Types.ObjectId,
        updatedAt: Date,
        chaptersCompleted: [string],
    }],
}

export const UserLibrarySchema = new Schema({
    saved: [{ type: Schema.Types.ObjectId }],
    completed: [{ type: Schema.Types.ObjectId }],
    view: [{
        bookId: { type: Schema.Types.ObjectId },
        createdAt: { type: Date },
    }],
    smallGroups: [{ type: Schema.Types.ObjectId }],
    reading: [{
        bookId: { type: Schema.Types.ObjectId, ref: 'bookSummary', index: true },
        chaptersCompleted: [{ type: String }],
        updatedAt: { type: Date },
    }],
    categories: [{ type: Schema.Types.ObjectId }],
}, { strict: 'throw' })

export const UserLibraryModel =
    mongoose.model<IUserLibrary>(
        'userLibrary', UserLibrarySchema
    )
