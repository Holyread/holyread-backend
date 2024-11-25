import { NotificationsModel } from '../../../models/index'

/** Create notifications */
const createNotification = async (body: any) => {
    try {
        body.notification.status = 'unread'
        await NotificationsModel.create(body)
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createNotification
}