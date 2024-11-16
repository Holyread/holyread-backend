import mongoose, { Schema, Types } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IUserFeedBack extends mongoose.Document {
    userId: Types.ObjectId,
    experienceRating?: string,
    likedFeature?: string,
    comment?: string,
    improvementSuggestions?: string
    createdAt?: Date
}

export type createUserFeedBackType = {
    title: string,
    userId: Types.ObjectId,
    experienceRating?: string,
    likedFeature?: string,
    comment?: string,
    improvementSuggestions?: string
    createdAt?: Date
} 

export type getUserFeedBackType = {
    _id?: string,
    userId: Types.ObjectId,
    experienceRating?: string,
    likedFeature?: string,
    comment?: string,
    improvementSuggestions?: string
    createdAt?: Date
}

export const UserFeedBackSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    experienceRating: {
        type: String,
        required: true
    },
    likedFeature: {
        type: String,
    },
    comment: {
        type: String,
    },
    improvementSuggestions: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { strict: 'throw' })

export const UserFeedBackModel = mongoose.model<IUserFeedBack>('userFeedBack', UserFeedBackSchema)
