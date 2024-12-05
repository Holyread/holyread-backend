import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IAppVersion extends mongoose.Document {
    platform?: string,
    version?: string,
    releaseNotes?: string
}

export type createAppVersionType = {
    platform?: string,
    version?: string,
    releaseNotes?: string
}

export type getAppVersionType = {
    _id?: string,
    platform?: string,
    version?: string,
    releaseNotes?: string
}

export const AppVersionSchema = new Schema({
    platform: {
        type: String, // 'android' or 'ios'
        required: true,
        enum: ['android', 'ios'],
    },
    version: {
        type: String,
        required: true,
    },
    releaseNotes: {
        type: String,
    },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const AppVersionModel = mongoose.model<IAppVersion>('AppVersion', AppVersionSchema)
