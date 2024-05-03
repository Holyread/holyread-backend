import mongoose, { Schema } from 'mongoose'

mongoose.set('autoIndex', true);

export interface INotifications extends mongoose.Document {
    notification: {
        title: string,
        description: string,
        status: 'read' | 'unread',
        success: boolean,
        errorMessage: string,
    },
    type: string,
    userId: string
}

export const NotificationsSchema = new Schema({
    notification: {
        title: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String, enum: ['read', 'unread'], default: 'unread' },
        success: { type: Boolean },
        errorMessage: { type: String },
    },
    type: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
}, { strict: 'throw' })

export const NotificationsModel = mongoose.model<INotifications>('notifications', NotificationsSchema)
