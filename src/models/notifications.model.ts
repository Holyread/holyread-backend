import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface INotifications extends mongoose.Document {
    notification: {
        type: string,
        title?: string,
        description?: string,
    },
    userId?: string
}

export const NotificationsSchema = new Schema({
    notification: {
        title: { type: String },
        description: { type: String },
    },
    type: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'user' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const NotificationsModel = mongoose.model<INotifications>('notifications', NotificationsSchema)
