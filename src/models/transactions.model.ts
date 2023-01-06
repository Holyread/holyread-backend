import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface ITransactions extends mongoose.Document {
    latestInvoice?: string,
    planCreatedAt: Date,
    planExpiredAt: Date,
    userId: string,
    total: Number,
    status: string,
    paymentMethod?: Object,
    account?: {
        country: string,
        name: string,
        taxIds: string,
    },
    amount?: {
        subtotal: Number,
        tax?: string,
        total: Number,
        discount?: Number
    },
    statusTransitions?: { type: Object },
    customer?: {
        email: string,
        name: string,
        phone?: string,
        shipping: Object
    },
    invoiceAt?: { type: Date },
    reason?: string,
    paymentLink?: string,
    device: string,
    stripeSubscriptionId?: string,
    event?: string,
    planId?: string
}

export type createTransationsType = {
    latestInvoice?: string,
    planCreatedAt: Date,
    planExpiredAt: Date,
    userId: string,
    total: Number,
    status: string,
    paymentMethod?: Object,
    account?: {
        country: string,
        name: string,
        taxIds: string,
    },
    amount?: {
        subtotal: Number,
        tax?: string,
        total: Number,
        discount?: Number
    },
    statusTransitions?: { type: Object },
    customer?: {
        email: string,
        name: string,
        phone?: string,
        shipping: Object
    },
    invoiceAt?: { type: Date },
    reason?: string,
    paymentLink?: string,
    device: string,
    stripeSubscriptionId?: string,
    event?: string,
    planId?: string
}

export type getTransactionsType = {
    latestInvoice?: string,
    planCreatedAt: Date,
    planExpiredAt: Date,
    userId: string,
    total: Number,
    status: string,
    paymentMethod?: Object,
    account?: {
        country: string,
        name: string,
        taxIds: string,
    },
    amount?: {
        subtotal: Number,
        tax?: string,
        total: Number,
        discount?: Number
    },
    statusTransitions?: { type: Object },
    customer?: {
        email: string,
        name: string,
        phone?: string,
        shipping: Object
    },
    invoiceAt?: { type: Date },
    reason?: string,
    paymentLink?: string,
    device: string,
    stripeSubscriptionId?: string,
    event?: string,
    planId?: string
}

export const TransactionsSchema = new Schema({
    latestInvoice: { type: String },
    planCreatedAt: { type: Date },
    planExpiredAt: { type: Date },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    total: { type: Number },
    status: { type: String },
    paymentMethod: { type: Object },
    account: {
        country: String,
        name: String,
        taxIds: String,
    },
    amount: {
        subtotal: Number,
        tax: String,
        total: Number,
        discount: Number
    },
    statusTransitions: { type: Object },
    customer: {
        email: String,
        name: String,
        phone: String,
        shipping: Object
    },
    invoiceAt: { type: Date },
    reason: { type: String, default: '' },
    paymentLink: { type: String, default: '' },
    device: { type: String, enum: ['web', 'app'], required: true },
    stripeSubscriptionId: { type: String },
    event: { type: String },
    planId: { type: String }
}, { strict: 'throw', timestamps: true })

TransactionsSchema.index({ createdAt: -1 });

export const TransactionsModel = mongoose.model<ITransactions>('transactions', TransactionsSchema)
