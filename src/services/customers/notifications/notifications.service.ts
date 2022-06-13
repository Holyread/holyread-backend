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
const createNotification = async (body: Object) => {
    try {
        await NotificationsModel.create(body)
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default { getUserNotifications, deleteNotifications, createNotification }
