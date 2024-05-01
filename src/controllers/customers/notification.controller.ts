import userServices from '../../services/customers/users/user.service'
import notificationServices from '../../services/customers/notifications/notifications.service'
import { NextFunction } from 'express'
import { responseMessage } from '../../constants/message.constant'
import Boom from '@hapi/boom';
import { pushNotification } from '../../lib/utils/utils';

const notificationsControllerResponse = responseMessage.notificationsControllerResponse

const fetchNotifications = async (socket, query) => {
      userServices.getOneUserByFilter(query).then(res => {
            socket.emit('fetchNotifications', res?.notifications || [])
      })
}

const clearNotifications = async (socket, query) => {
      await notificationServices.deleteNotifications({ userId: socket.user._id })
      await fetchNotifications(socket, query)
}

/** create user notification */
const createUserNotification = async (req: Request | any, res: Response | any, next: NextFunction) => {
      try {
            await notificationServices.createNotification({
                  notification: {
                        title: req.body.title,
                        description: req.body.description,
                  },
                  type: req.body.type,
                  userId: req.user._id,
            });
            res.status(200).send({ message: notificationsControllerResponse.createNotificationSuccess })
            if (req.body.title.includes('subscription') && !req.user?.notification?.subscription) return;
            /** Push notification */
            if (req.user.pushTokens.length && req.user?.notification?.push) {
                  const tokens = req.user.pushTokens.map(i => i.token)
                  pushNotification(tokens, req.body.title, req.body.description)
            }
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/** update user notification */
const updateUserNotification = async (req: Request | any, res: Response | any, next: NextFunction) => {
      try {
            const query = req.query.id ? { _id: req.query.id, userId: req.user._id } : { userId: req.user._id }
            req.body.status && await notificationServices.updateNotification(query, { 'notification.status': req.body.status })
            res.status(200).send({ message: notificationsControllerResponse.updateNotificationSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

/** create user notification */
const deleteUserNotification = async (req: Request | any, res: Response | any, next: NextFunction) => {
      try {
            const query = req.query.id ? { _id: req.query.id, userId: req.user._id } : { userId: req.user._id }
            if (req.query.status) query['notification.status'] = req.query.status
            await notificationServices.deleteNotifications(query)
            res.status(200).send({ message: notificationsControllerResponse.deleteNotificationSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

export {
      fetchNotifications,
      clearNotifications,
      createUserNotification,
      updateUserNotification,
      deleteUserNotification
}
