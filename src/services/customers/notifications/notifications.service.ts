import { NotificationsModel } from '../../../models/index'

/** Get notifications */
const getUserNotifications = async (query: object) => {
    try {
        const notificationDetails = await NotificationsModel.findOne(query).lean().exec()
        return notificationDetails?.notification?.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) || []
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
        const notificationDetails = await getUserNotifications(query)

        const now = new Date()
        let newBody: any = {
            notification: [{
                title: body.title,
                description: body.description,
                type: body.type,
                updatedAt: now
            }]
        }
        if (notificationDetails && notificationDetails.length) {
            const notificationIndex = notificationDetails.findIndex(n => n.title === body.title && n.type === body.type)
            notificationIndex > -1
                ? notificationDetails[notificationIndex] = {
                    ...notificationDetails[notificationIndex],
                    title: body.title,
                    description: body.description,
                    type: body.type,
                    updatedAt: now
                }
                : notificationDetails.push({
                    title: body.title,
                    description: body.description,
                    type: body.type,
                    updatedAt: now
                })
            newBody = {
                notification: notificationDetails
            }
        }
        await NotificationsModel.findOneAndUpdate(query, { ...newBody, updatedAt: new Date() }, { upsert: true, new: true })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default { getUserNotifications, deleteNotifications, updateNotification }
