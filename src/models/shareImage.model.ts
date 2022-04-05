import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IShareImage extends mongoose.Document {
    fontColor?: string,
    fontSize?: number,
    user?: string,
    image: string
}

export type createShareImageType = {
    fontColor?: string,
    fontSize?: number,
    user?: string,
    image: string
}

export type getShareImageType = {
    _id?: string,
    fontColor?: string,
    fontSize?: number,
    user?: string,
    image: string
}

export const ShareImageSchema = new Schema({
    fontColor: { type: String, index: true },
    fontSize: { type: Number, index: true },
    user: { type: String },
    image: { type: String, required: true },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const ShareImageModel = mongoose.model<IShareImage>('shareImage', ShareImageSchema)
