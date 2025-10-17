import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IMeditationCategory extends mongoose.Document {
    title: string,
    image: string,
    status?: 'Active' | 'Deactive'
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type createMeditationCategoryType = {
    title: string,
    image: string,
    status?: 'Active' | 'Deactive'
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type getMeditationCategoryType = {
    _id?: string,
    title?: string,
    image: string,
    status?: 'Active' | 'Deactive'
    language?: {type: Schema.Types.ObjectId, ref: 'language'}
}

export const MeditationCategorySchema = new Schema({
    title: { type: String, required: true, index: true },
    image: { type: String },
    status: { type: String, required: true, index: true },
    language: {type: Schema.Types.ObjectId, ref: 'language', index: true},
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const MeditationCategoryModel = mongoose.model<IMeditationCategory>('meditationCategories', MeditationCategorySchema)
