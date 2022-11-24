import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IRevenue extends mongoose.Document {
    year: number,
    month: number,
    week: number
}

export type createRevenueType = {
    year: number,
    month: number,
    week: number
}

export type getRevenueType = {
    _id?: string,
    year: number,
    month: number,
    week: number
}

export const RevenueSchema = new Schema({
    year: { type: Number },
    month: { type: Number },
    week: { type: Number },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const RevenueModel = mongoose.model<IRevenue>('revenue', RevenueSchema)
