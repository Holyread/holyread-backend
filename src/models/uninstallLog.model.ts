import mongoose, {Schema, Types} from 'mongoose'

mongoose.set('autoIndex', true);

export interface IUninstallLog extends mongoose.Document {
    title: string,
    token?: string,
    date?: Date,
    userId: Types.ObjectId,
}

export type createUninstallLogType = {
    title: string,
    token?: string,
    date?: Date,
    userId: Types.ObjectId,
}

export type getUninstallLogType = {
    _id?: string,
    token?: string,
    date?: Date,
    userId: Types.ObjectId,
}

export const UninstallLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user' },
    token: { type: String, required: true, index: true },
    date: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const UninstallLogModel = mongoose.model<IUninstallLog>('uninstallLog', UninstallLogSchema)
