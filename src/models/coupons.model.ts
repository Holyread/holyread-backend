import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface ICoupons extends mongoose.Document {
    code: string,
    expireDate: Date, // stripe redeem_by
    redeemCount: number,
    discount: number, // stripe percent_off
    duration: 'once' | 'repeating' | 'forever',
    type: string,
    maxRedemptions: number
}

export type createCouponType = {
    code: string,
    expireDate: Date,
    redeemCount: number,
    discount: number,
    duration: 'once' | 'repeating' | 'forever',
    type: string,
    maxRedemptions: number
}

export type getCouponType = {
    _id?: string,
    code: string,
    expireDate?: Date,
    redeemCount?: number,
    discount?: number,
    duration?: 'once' | 'repeating' | 'forever',
    type?: string,
    maxRedemptions: number
}

export const CouponsSchema = new Schema({
    code: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    expireDate: {
        type: Date,
        required: true,
        index: true,
    },
    redeemCount: {
        type: Number,
        required: true,
        index: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    duration: {
        type: String,
        default: 'once',
        enum: [
            'once',
            'forever',
            'repeating',
        ],
    },
    type: {
        type: String,
        enum: [
            'yearly',
            'monthly',
        ],
    },
    maxRedemptions: {
        type: Number,
    },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const CouponsModel
    = mongoose.model<ICoupons>(
        'coupons',
        CouponsSchema
    )
