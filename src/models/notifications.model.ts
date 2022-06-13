import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface INotifications extends mongoose.Document {
    notification: {
        title: string,
        description: string,
    },
    type: string,
    userId: string
}

export const NotificationsSchema = new Schema({
    notification: {
        title: { type: String, required: true },
        description: { type: String, required: true },
    },
    type: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    }
}, {strict: 'throw'})

export const NotificationsModel = mongoose.model<INotifications>('notifications', NotificationsSchema)
