import mongoose, { Schema } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface ICronLog extends mongoose.Document {
    jobName?: string,
    message?: string,
    status?: 'running' | 'success' | 'failed',
    endedAt : Date
}

export type createCronLogType = {
    jobName?: string,
    message?: string,
    status?: 'running' | 'success' | 'failed'
}

export type getCronLogType = {
    _id?: string,
    jobName?: string,
    message?: string,
    status?: 'running' | 'success' | 'failed'
}

export const CronLogSchema = new Schema({
    jobName: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    message: { type: String },
    startedAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    endedAt: { type: Date },
}, { strict: 'throw' })

export const CronLogModel = mongoose.model<ICronLog>('cronLog', CronLogSchema)
