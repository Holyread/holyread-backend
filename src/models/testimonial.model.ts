import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface ITestimonial extends mongoose.Document {
    name: string,
    image: string,
    description?: string,
    status?: 'Active' | 'DeActive'
}

export type createTestimonialType = {
    name: string,
    image: string,
    description?: string,
    status?: 'Active' | 'DeActive'
}

export type getTestimonialType = {
    _id?: string,
    name?: string,
    image: string,
    description?: string,
    status?: 'Active' | 'DeActive'
}

export const TestimonialSchema = new Schema({
    name: { type: String, required: true, index: true },
    image: { type: String, required: true },
    description: { type: String },
    status: { type: String},
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const TestimonialModel = mongoose.model<ITestimonial>('testimonial', TestimonialSchema)
