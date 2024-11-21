import { FilterQuery } from 'mongoose';
import { formattedDate } from '../../../lib/utils/utils';
import { CustomNotificationsModel } from '../../../models/index'
import { ICustomNotifications } from '../../../models/customNotification.model';

/** Get notifications */
const getUserNotifications = async (skip: number, limit, search: FilterQuery<ICustomNotifications>, sort) => {
    try {
        const notifications = await CustomNotificationsModel.find(search).select('-userIds').skip(skip).limit(limit).sort(sort).lean()

        notifications.map((i: any) => {
            i.createdAt = formattedDate(i.createdAt).replace(/ /g, ' ');
        });

        const count = await CustomNotificationsModel.find(search).countDocuments()

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
    deleteNotification,
}
