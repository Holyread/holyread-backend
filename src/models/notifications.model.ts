import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface INotifications extends mongoose.Document {
    notification: [{
        type: { type: string },
        title: string,
        description: string,
        updatedAt: Date
    }],
    userId?: string
}

export const NotificationsSchema = new Schema({
    notification: [{
        type: { type: String },
        title: { type: String },
        description: { type: String },
        updatedAt: { type: Date }
    }],
    userId: { type: Schema.Types.ObjectId, ref: 'user' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const NotificationsModel = mongoose.model<INotifications>('notifications', NotificationsSchema)
