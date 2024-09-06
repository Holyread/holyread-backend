import mongoose, { Schema, Types } from 'mongoose'

export interface IUserLibrary extends mongoose.Document {
    _id?: Types.ObjectId
    saved?: [Types.ObjectId],
    completed?: [Types.ObjectId],
    view?: [{
        bookId: Types.ObjectId,
        createdAt: Date
    }],
    smallGroups?: [Types.ObjectId]
    reading?: [{
        bookId: Types.ObjectId,
        createdAt : Date,
        updatedAt: Date,
        chaptersCompleted: [string],
    }],
    devotionalCategories: [string],
    devotionalViews: [Types.ObjectId],
    freeSummary: Types.ObjectId,
    freeNotificationBooks: [{
        bookId: Types.ObjectId,
        createdAt: Date
    }],
    categories?: [Types.ObjectId]
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
        createdAt : Date,
        updatedAt: Date,
        chaptersCompleted: [string],
    }],
    devotionalCategories: [string],
    devotionalViews: [Types.ObjectId],
    freeSummary: Types.ObjectId,
    freeNotificationBooks: [{
        bookId: Types.ObjectId,
        createdAt: Date
    }],
    categories?: [Types.ObjectId]
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
        createdAt : Date,
        updatedAt: Date,
        chaptersCompleted: [string],
    }],
    devotionalCategories: [string]
    devotionalViews: [Types.ObjectId],
    freeSummary: Types.ObjectId,
    freeNotificationBooks: [{
        bookId: Types.ObjectId,
        createdAt: Date
    }],
    categories?: [Types.ObjectId]
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
        createdAt: {
            type: Date, default: () => {
                return new Date()
            },
        },
        updatedAt: { type: Date },
    }],
    categories: [{ type: Schema.Types.ObjectId }],
    devotionalCategories: [{ type: String }],
    devotionalViews: [{ type: Schema.Types.ObjectId }],
    freeSummary: { type: Schema.Types.ObjectId },
    freeNotificationBooks: [{
        bookId: { type: Schema.Types.ObjectId },
        createdAt: { type: Date },
    }],
}, { strict: 'throw' })

export const UserLibraryModel =
    mongoose.model<IUserLibrary>(
        'userLibrary', UserLibrarySchema
    )
