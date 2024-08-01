import mongoose, { Schema, Types } from 'mongoose'

mongoose.set('autoIndex', true);

export interface IInvalidToken extends mongoose.Document {
    userId: Types.ObjectId,
    invalidTokens: [string],
}

export const InvalidTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    invalidTokens: [{ type: String, required: true }],
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: { type: Date },
}, { strict: 'throw' })

export const InvalidTokenModel = mongoose.model<IInvalidToken>('invalidToken', InvalidTokenSchema)
