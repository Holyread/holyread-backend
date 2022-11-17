import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IInAppNotification extends mongoose.Document {
    result: Object
}

export type createInAppNotificationType = {
    result: Object
}

export type getInAppNotificationType = {
    result: Object
}

export const InAppNotificationSchema = new Schema({
    result: { type: Object },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const InAppNotificationModel = mongoose.model<IInAppNotification>('InAppNotification', InAppNotificationSchema)
