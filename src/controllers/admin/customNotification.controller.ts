import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { calculateDateInThePast, getSearchRegexp, pushNotification } from '../../lib/utils/utils'
import customNotificationService from '../../services/admin/customNotification/customNotification.service';
import usersService from '../../services/admin/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { dataTable, BATCH_SIZE } from '../../constants/app.constant';
import { ICustomNotifications } from '../../models/customNotification.model';
import { FilterQuery } from 'mongoose';
import { NotificationsModel } from '../../models';

const adminControllerResponse = responseMessage.adminControllerResponse
const { notificationsControllerResponse } = responseMessage

const sendCustomNotificationToAllUsers = async (req: Request | any, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { description, title, userFilter, link } = req.body
        const users: string[] = [];

        let type;
        if (req.body.link) {
            type = "custom-link"
        }

        const commonUserObj: any = {
            'notification.push': true,
            status: 'Active',
        };

        if (userFilter === 'InActiveUsers') {
            // Filter inactive users based on lastSeen value in the last 7 days
            const sevenDaysAgo = calculateDateInThePast(7);
            commonUserObj.lastSeen = { $lte: sevenDaysAgo };
        }

        const mobileUserObj: any = {
            ...commonUserObj,
            'pushTokens.0': { $exists: true },
        };

        if (userFilter?.toLowerCase()?.includes('cancelled plan')) {
            mobileUserObj.inAppSubscriptionStatus = 'Canceled'
        }

        if (userFilter?.toLowerCase()?.includes('freemium')) {
            mobileUserObj.inAppSubscription = { $exists: false }
        }

        if (userFilter?.toLowerCase()?.includes('presignupusers')) {
            mobileUserObj.isSignedUp = false
        }

        const mobileUsers = await usersService.getUseForCustomNotification(mobileUserObj, 'timeZone pushTokens')

        const data = {
            link: link
        }

        // push notification
        for (let i = 0; i < mobileUsers.length; i += BATCH_SIZE) {
            const batchUsers = mobileUsers.slice(i, i + BATCH_SIZE);
            const tokens = batchUsers.flatMap(user => user.pushTokens.map(ti => ti.token));
            await pushNotification(tokens, title, description, JSON.stringify(data));
            users.push(...batchUsers.map(user => user._id));
        }

        await customNotificationService.createNotification({
            userIds: users,
            title,
            description,
            type: type,
            totalUsers: users.length,
        })

        for (const user of users) {
            const notificationLog = new NotificationsModel({
                userId: user,
                type: type || 'normal',
                notification: {
                    title: title,
                    description: description,
                    link: link,
                },
                createdAt: new Date(),
            });
            await notificationLog.save();
        }
        return res.status(200).send({ message: adminControllerResponse.notificationSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const params = req.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: FilterQuery<ICustomNotifications> = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                    { description: await getSearchRegexp(params.search) },
                ],
            }
        }
        const sortColumn: any = params.column || 'createdAt';
        const sortOrder = params.order || 'desc';
        const notificationSorting = { [sortColumn]: sortOrder };

        /** Get setting from db */
        const notifications: any = await customNotificationService.getUserNotifications(Number(skip), Number(limit), searchFilter, notificationSorting)

        if (!notifications) return next(Boom.notFound(notificationsControllerResponse.getNotificationFailure))

        res.status(200).send({
            message: notificationsControllerResponse.fetchNotificationSuccess,
            data: notifications,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    sendCustomNotificationToAllUsers,
    getUserNotifications
}
