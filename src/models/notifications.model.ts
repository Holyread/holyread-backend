import mongoose, { Schema, Types } from 'mongoose'

mongoose.set('autoIndex', true);

export interface INotifications extends mongoose.Document {
    notification: {
        _id: Types.ObjectId
        title: string,
        description: string,
        status: 'read' | 'unread',
        success: boolean,
        errorMessage: string,
        bookId: Types.ObjectId,
        dailyDevotionalId : Types.ObjectId,
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
        bookId : { type: Schema.Types.ObjectId, ref: 'bookSummary' },
        dailyDevotionalId : { type: Schema.Types.ObjectId, ref: 'dailyDevotional' },
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
