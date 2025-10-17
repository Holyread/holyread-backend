import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface ITestimonial extends mongoose.Document {
    name: string,
    image: string,
    description?: string,
    status?: 'Active' | 'Deactive'
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type createTestimonialType = {
    name: string,
    image: string,
    description?: string,
    status?: 'Active' | 'Deactive'
    language: {type: Schema.Types.ObjectId, ref: 'language'}
}

export type getTestimonialType = {
    _id?: string,
    name?: string,
    image: string,
    description?: string,
    status?: 'Active' | 'Deactive'
    language?: {type: Schema.Types.ObjectId, ref: 'language'}
}

export const TestimonialSchema = new Schema({
    name: { type: String, required: true, index: true },
    image: { type: String, required: true },
    description: { type: String },
    status: { type: String},
    language: {type: Schema.Types.ObjectId, ref: 'language', index: true},
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const TestimonialModel = mongoose.model<ITestimonial>('testimonial', TestimonialSchema)
