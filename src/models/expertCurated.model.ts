import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IExpertCurated extends mongoose.Document {
    title: string,
    description: string,
    shortDescription: string,
    image: string,
    views?: number,
    status?: 'Active' | 'Deactive',
    publish?: boolean,
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type createExpertCuratedType = {
    title: string
    description: string,
    shortDescription: string,
    image: string,
    views?: number,
    status?: 'Active' | 'Deactive',
    publish?: boolean,
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type getExpertCuratedType = {
    _id?: string,
    title: string,
    description: string,
    shortDescription: string,
    image?: string,
    views?: number,
    status?: 'Active' | 'Deactive',
    language?: {type: Schema.Types.ObjectId, ref: 'language'},
    publish?: boolean,
}

export const ExpertCuratedSchema = new Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    image: { type: String, default: '' },
    views: { type: Number, default: 0 },
    publish: { type: Boolean, default: false },
    language: {type: Schema.Types.ObjectId, ref: 'language', index: true},
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    status: { type: String, default: 'Active' },
    updatedAt: { type: Date },
    publishedAt: { type: Date },
}, { strict: 'throw' })

export const ExpertCuratedModel = mongoose.model<IExpertCurated>('expertCurated', ExpertCuratedSchema)
