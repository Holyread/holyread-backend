import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IHandouts extends mongoose.Document {
    answers: [{
        question: number,
        answer: string
    }],
    user: string,
    smallGroup: string
}

export type createHandoutsType = {
    answers: [{
        question: number,
        answer: string
    }],
    user: string,
    smallGroup: string
}

export type getHandoutsType = {
    _id?: string,
    answers: [{
        question: number,
        answer: string
    }],
    user: string,
    smallGroup: string
}

export const HandoutsSchema = new Schema({
    answers: [{
        question: Number,
        answer: String
    }],
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    smallGroup: {
        type: Schema.Types.ObjectId, ref: 'smallgroup', required: true
    },
}, { strict: 'throw', timestamps: true })

HandoutsSchema.index({ user: -1, smallGroup: -1 });

export const HandoutsModel = mongoose.model<IHandouts>('handouts', HandoutsSchema)
