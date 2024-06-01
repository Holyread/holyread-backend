import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import notificationsService from '../../services/customers/notifications/notifications.service';
import { io } from '../../app';
import { fetchNotifications } from '../customers/notification.controller';
import { calculateDateInThePast, getSearchRegexp, pushNotification } from '../../lib/utils/utils'
import customNotificationService from '../../services/admin/customNotification.service';
import usersService from '../../services/admin/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { dataTable, BATCH_SIZE } from '../../constants/app.constant';

const adminControllerResponse = responseMessage.adminControllerResponse
const { notificationsControllerResponse } = responseMessage

const sendCustomNotificationToAllUsers = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        const { description, title, userFilter } = req.body
        const users: string[] = [];

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

        // push notification
        for (let i = 0; i < mobileUsers.length; i += BATCH_SIZE) {
            const batchUsers = mobileUsers.slice(i, i + BATCH_SIZE);
            const tokens = batchUsers.flatMap(user => user.pushTokens.map(ti => ti.token));
            await pushNotification(tokens, title, description);
            users.push(...batchUsers.map(user => user._id));
        }

        const webUserObj = {
            ...commonUserObj,
            device: 'web',
        }

        if (userFilter?.toLowerCase()?.includes('cancelled plan')) {
            webUserObj.$or = [
                ...(webUserObj.$or || []),
                { 'stripe.status': 'canceled' }]
        }

        if (userFilter?.toLowerCase()?.includes('freemium')) {
            webUserObj.$or = [
                ...(webUserObj.$or || []),
                {
                    'stripe.status': {
                        $in: [
                            'trialing',
                            'incomplete',
                            'past_due',
                            'unpaid',
                            'incomplete_expired',
                        ],
                    },
                },
            ]
        }

        if (userFilter?.toLowerCase()?.includes('presignupusers')) {
            webUserObj.isSignedUp = false
        }

        const webUsers: any = await usersService.getUseForCustomNotification(webUserObj, '');

        await Promise.all(webUsers?.map(async (user) => {
            try {
                await notificationsService.createNotification({
                    userId: user._id,
                    type: 'customNotification',
                    notification: {
                        title: `${title}`,
                        description: `${description}`,
                    },
                });
                // send notification
                fetchNotifications(io.sockets, { _id: user._id })

                // If notification creation is successful
                users.push(user._id);
            } catch (e) {
                console.error('Error creating notification:', e);
            }
        }));

        await customNotificationService.createNotification({
            userIds: users,
            title,
            description,
            type: 'customNotification',
            totalUsers: users.length,
        })
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

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                    { description: await getSearchRegexp(params.search) },
                ],
            }
        }
        const notificationSorting = [];
        switch (params.column) {
            case 'title':
                notificationSorting.push(['title', params.order || 'asc']);
                break;
            case 'description':
                notificationSorting.push(['subject', params.order || 'asc']);
                break;
            case 'totalUsers':
                notificationSorting.push(['totalUsers', params.order || 'asc']);
                break;
            case 'createdAt':
                notificationSorting.push(['createdAt', params.order || 'asc']);
                break;
            default:
                notificationSorting.push(['createdAt', 'desc']);
                break;
        }

        /** Get setting from db */
        const notifications: any = await customNotificationService.getUserNotifications(Number(skip), Number(limit), searchFilter, notificationSorting)

        if (!notifications) {
            return next(Boom.notFound(notificationsControllerResponse.getNotificationFailure))
        }
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
