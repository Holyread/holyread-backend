import { NotificationsModel } from '../../../models/index'

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

export default { deleteNotifications, updateNotification }
