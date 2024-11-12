import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface ICustomNotifications extends mongoose.Document {
    title: string,
    description: string,
    link: string,
    type: string,
    userIds: [string],
    totalUsers: number
    createdAt: Date
}

export const CustomNotificationsSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String },
    type: {
        type: String,
        default: 'normal',
        enum: [
            'normal',
            'custom-link',
        ],
    },
    userIds: [{ type: Schema.Types.ObjectId, ref: 'user', required: true, index: true }],
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    totalUsers: { type: Number },
}, { strict: 'throw' })

export const CustomNotificationsModel = mongoose.model<ICustomNotifications>('customNotifications', CustomNotificationsSchema)
