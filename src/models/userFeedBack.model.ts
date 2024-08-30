import mongoose, { Schema, Types } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IUserFeedBack extends mongoose.Document {
    userId: Types.ObjectId,
    experienceRating?: string,
    likedFeatures?: [string],
    comment?: string,
    createdAt?: Date
}

export type createUserFeedBackType = {
    title: string,
    userId: Types.ObjectId,
    experienceRating?: string,
    likedFeatures?: [string],
    comment?: string,
    createdAt?: Date
} 

export type getUserFeedBackType = {
    _id?: string,
    userId: Types.ObjectId,
    experienceRating?: string,
    likedFeatures?: [string],
    comment?: string,
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
        enum: ['Love it!', 'It’s okay', 'Could be better'],
        required: true
    },
    likedFeatures: {
        type: [String],
        enum: [
            'Offline mode',
            'Audio summary',
            'Making Notes and Highlights',
            'Share quote option',
            'User friendly',
            'Other'
        ]
    },
    comment: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { strict: 'throw' })

export const UserFeedBackModel = mongoose.model<IUserFeedBack>('userFeedBack', UserFeedBackSchema)
