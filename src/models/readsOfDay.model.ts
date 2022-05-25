import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IReadsOfDay extends mongoose.Document {
    title: string,
    subTitle: string,
    shortDescription?: string,
    description: string,
    image: string,
    status?: 'Active' | 'Deactive'
}

export type createReadsOfDayType = {
    title: string,
    subTitle: string,
    shortDescription?: string,
    description: string,
    image: string,
    status?: 'Active' | 'Deactive'
}

export type getReadsOfDayType = {
    _id?: string,
    title?: string,
    subTitle?: string,
    shortDescription?: string,
    description?: string,
    image?: string,
    status?: 'Active' | 'Deactive'
}

export const ReadsOfDaySchema = new Schema({
    title: { type: String, required: true, index: true },
    subTitle: { type: String, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const ReadsOfDayModel = mongoose.model<IReadsOfDay>('readsOfDay', ReadsOfDaySchema)
