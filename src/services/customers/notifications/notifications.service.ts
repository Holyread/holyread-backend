import { NotificationsModel } from '../../../models/index'

/** Get notifications */
const getUserNotifications = async (query: object) => {
    try {
        const notificationDetails = await NotificationsModel.find(query).sort([['updatedAt', 'DESC']]).lean().exec()
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

/** Update notifications */
const updateNotification = async (query: object, body) => {
    try {
        await NotificationsModel.updateOne(query, { ...body, updatedAt: new Date() }, { upsert: true })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default { getUserNotifications, deleteNotifications, updateNotification }
