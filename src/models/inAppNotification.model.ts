import mongoose, {Schema} from 'mongoose'

mongoose.set('autoIndex', true);

export interface IInAppNotification extends mongoose.Document {
    result: object
}

export type createInAppNotificationType = {
    result: object
}

export type getInAppNotificationType = {
    result: object
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
