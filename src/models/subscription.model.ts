import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface ISubscription extends mongoose.Document {
    title: string,
    price: string,
    duration: string,
    intervalCount: number,
    description: string,
    stripePlanId?: string,
    status?: 'Active' | 'Deactive',
}

export type createSubscriptionType = {
    title: string,
    price: string,
    duration: string,
    intervalCount: number,
    description: string,
    stripePlanId?: string,
    status?: 'Active' | 'Deactive',
}

export type getSubscriptionType = {
    _id?: string,
    title?: string,
    price?: string,
    duration?: string,
    intervalCount: number,
    description?: string,
    stripePlanId?: string,
    status?: 'Active' | 'Deactive',
}

export const SubscriptionsSchema = new Schema({
    title: { type: String, required: true, index: true },
    price: { type: String, required: true, index: true },
    duration: { type: String, required: true },
    intervalCount: { type: Number, default: 1 },
    status: { type: String, default: 'Active' },
    description: { type: String, default: '' },
    stripePlanId: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const SubscriptionsModel = mongoose.model<ISubscription>('subscriptions', SubscriptionsSchema)
