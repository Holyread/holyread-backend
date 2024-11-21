import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface ISubscriber extends mongoose.Document {
    email: string,
    createdAt: Date
}

export type createSubscriberType = {
    email: string,
    createdAt: Date
}

export type getSubscriberType = {
    _id?: string,
    email: string,
    createdAt: Date,
}

export const SubscriberSchema = new Schema({
    email: { type: String, required: true, index: true, validate: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
}, { strict: 'throw' })

export const SubscriberModel = mongoose.model<ISubscriber>('subscriber', SubscriberSchema)
