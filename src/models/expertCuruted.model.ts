import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IExpertCuruted extends mongoose.Document {
    title: string,
    description: string,
    shortDescription: string,
    image: string,
    status?: 'Active' | 'DeActive',
}

export type createExpertCurutedType = {
    title: string
    description: string,
    shortDescription: string,
    image: string,
    status?: 'Active' | 'DeActive'
}

export type getExpertCurutedType = {
    _id?: string,
    title: string,
    description: string,
    shortDescription: string,
    image?: string,
    status?: 'Active' | 'DeActive'
}

export const ExpertCurutedSchema = new Schema({
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

export const ExpertCurutedModel = mongoose.model<IExpertCuruted>('expertCuruted', ExpertCurutedSchema)