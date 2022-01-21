import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface ISubscription extends mongoose.Document {
    title: string,
    price: string,
    duration: number,
    description: string,
    status?: 'Active' | ' Deactive'
}

export type createSubscriptionType = {
    title: string,
    price: string,
    duration: number,
    description: string,
    status?: 'Active' | ' Deactive'
}

export type getSubscriptionType = {
    _id?: string,
    title?: string,
    price?: string,
    duration?: number,
    description?: string,
    status?: 'Active' | ' Deactive'
}

export const SubscriptionsSchema = new Schema({
    title: { type: String, required: true, index: true },
    price: { type: String, required: true, index: true },
    duration: { type: Number, required: true },
    status: { type: String, default: 'Active' },
    description: { type: String, default: '' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const SubscriptionsModel = mongoose.model<ISubscription>('subscriptions', SubscriptionsSchema)
