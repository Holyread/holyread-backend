import { formattedDate } from '../../lib/utils/utils';
import { CustomNotificationsModel } from '../../models/index'

/** Get notifications */
const getUserNotifications = async (skip: number, limit, search: object, sort) => {
    try {
        const notifications = await CustomNotificationsModel.find(search).select('-userIds').skip(skip).limit(limit).sort(sort).lean()

        notifications.map((i: any) => {
            i.createdAt = formattedDate(i.createdAt).replace(/ /g, ' ');
        });

        const count = await CustomNotificationsModel.find(search).count()

        return { count, notifications };
    } catch (e: any) {
        throw new Error(e);
    }
};


/** Create notifications */
const createNotification = async (body: any) => {
    try {
        await CustomNotificationsModel.create(body)
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Delete notifications */
const deleteNotification = async (id) => {
    try {
        await CustomNotificationsModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getUserNotifications,
    createNotification,
    deleteNotification
}
