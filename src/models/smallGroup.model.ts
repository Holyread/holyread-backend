import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface ISmallGroup extends mongoose.Document {
    title: string,
    books: [string],
    description: string,
    iceBreaker: string,
    introduction: string,
    questions: [{
        type: string
    }],
    backgroundColor?: string,
    coverImage: string,
    conclusion?: string,
    status?: 'Active' | 'Deactive'
}

export type createSmallGroupType = {
    title: string,
    books: [string],
    description: string,
    iceBreaker: string,
    introduction: string,
    questions: [{
        type: string
    }],
    backgroundColor?: string,
    coverImage: string,
    conclusion?: string,
    status: 'Active' | 'Deactive'
}

export type getSmallGroupType = {
    _id?: string,
    title: string,
    books?: [string],
    description?: string,
    iceBreaker?: string,
    introduction?: string,
    questions?: [{
        type: string
    }],
    backgroundColor?: string,
    coverImage?: string,
    conclusion?: string,
    status?: 'Active' | 'Deactive'
}

export const SmallGroupSchema = new Schema({
    title: { type: String, required: true, index: true },
    books: [{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'bookSummary',
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
    coverImage: { type: String, required: true },
    conclusion: { type: String, default: '' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const SmallGroupModel = mongoose.model<ISmallGroup>('smallGroup', SmallGroupSchema)
