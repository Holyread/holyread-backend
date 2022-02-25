import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IFaq extends mongoose.Document {
    question: string,
    answer: string,
    status?: 'Active' | 'Deactive'
}

export type createFaqType = {
    question: string,
    answer: string,
    status?: 'Active' | 'Deactive'
}

export type getFaqType = {
    _id?: string,
    question?: string,
    answer?: string,
    status?: 'Active' | 'Deactive'
}

export const FaqSchema = new Schema({
    question: { type: String, required: true, index: true },
    answer: { type: String, required: true, index: true },
    status: { type: String, default: 'Active' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const FaqModel = mongoose.model<IFaq>('faq', FaqSchema)
