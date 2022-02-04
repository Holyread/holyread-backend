import mongoose, {Schema} from 'mongoose'
import { BookSummaryModel } from './bookSummary.model'

mongoose.set('useCreateIndex', true)

export interface ISmallGroup extends mongoose.Document {
    coverImage: string,
    title: string,
    books: [string],
    description: string,
    iceBreaker: string,
    introduction: string,
    questions: [{
        type: string
    }],
    backgroundColor?: string,
    conclusion?: string,
    status?: 'Active' | 'DeActive'
}

export type createSmallGroupType = {
    coverImage: string,
    title: string,
    books: [string],
    description: string,
    iceBreaker: string,
    introduction: string,
    questions: [{
        type: string
    }],
    backgroundColor?: string,
    conclusion?: string,
    status: 'Active' | 'DeActive'
}

export type getSmallGroupType = {
    _id?: string,
    coverImage?: string,
    title: string,
    books?: [string],
    description?: string,
    iceBreaker?: string,
    introduction?: string,
    questions?: [{
        type: string
    }],
    backgroundColor?: string,
    conclusion?: string,
    status?: 'Active' | 'DeActive'
}

export const SmallGroupSchema = new Schema({
    title: { type: String, required: true, index: true },
    coverImage: { type: String, required: true, index: true },
    books: [{
        type: Schema.Types.ObjectId,
        ref: BookSummaryModel,
        required: true,
        index: true
    }],
    description: { type: String, required: true },
    status: { type: String, default: 'Active' },
    iceBreaker: { type: String, default: '' },
    introduction: { type: String, default: '' },
    questions: [{
        type: String, index: true
    }],
    backgroundColor: { type: String, default: '' },
    conclusion: { type: String, default: '' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const SmallGroupModel = mongoose.model<ISmallGroup>('smallGroup', SmallGroupSchema)
