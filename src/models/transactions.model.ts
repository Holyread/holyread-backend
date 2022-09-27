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
    reason?: string,
    paymentLink?: string
}

export type createTransationsType = {
    latestInvoice?: string, 
    planCreatedAt: Date,
    planExpiredAt: Date,
    userId: string,
    total: Number,
    status: string,
    paymentMethod?: Object,
    reason?: string,
    paymentLink?: string
}

export type getTransactionsType = {
    latestInvoice?: string, 
    planCreatedAt: Date,
    planExpiredAt: Date,
    userId: string,
    total: Number,
    status: string,
    paymentMethod?: Object,
    reason?: string,
    paymentLink?: string
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
    reason: { type: String, default: '' },
    paymentLink: { type: String, default: '' },
}, { strict: 'throw', timestamps: true })

TransactionsSchema.index({ createdAt: -1 });

export const TransactionsModel = mongoose.model<ITransactions>('transactions', TransactionsSchema)
