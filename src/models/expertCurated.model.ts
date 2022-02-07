import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IExpertCurated extends mongoose.Document {
    title: string,
    description: string,
    shortDescription: string,
    image: string,
    status?: 'Active' | 'Deactive',
}

export type createExpertCuratedType = {
    title: string
    description: string,
    shortDescription: string,
    image: string,
    status?: 'Active' | 'Deactive'
}

export type getExpertCuratedType = {
    _id?: string,
    title: string,
    description: string,
    shortDescription: string,
    image?: string,
    status?: 'Active' | 'Deactive'
}

export const ExpertCuratedSchema = new Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    image: { type: String, default: '' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    status: { type: String, default: 'Active' },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const ExpertCuratedModel = mongoose.model<IExpertCurated>('expertCurated', ExpertCuratedSchema)