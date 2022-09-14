import { NotificationsModel } from '../../../models/index'

/** Get notifications */
const getUserNotifications = async (query: object) => {
    try {
        const notificationDetails = await NotificationsModel.find(query).sort([['createdAt', 'DESC']]).lean().exec()
        return notificationDetails
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Delete notifications */
const deleteNotifications = async (query: object) => {
    try {
        await NotificationsModel.deleteMany(query, { new: true })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

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

/** Update notifications */
const updateNotification = async (query: any, body: any) => {
    try {
        await NotificationsModel.updateMany(query, body, { runValidators: true })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getUserNotifications,
    deleteNotifications,
    createNotification,
    updateNotification
}
