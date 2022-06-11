import userServices from '../../services/customers/users/user.service'
import notificationServices from '../../services/customers/notifications/notifications.service'
import { NextFunction } from 'express'
import { responseMessage } from '../../constants/message.constant'
import Boom from '@hapi/boom';

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

/** Update user notifications details */
const updateUserNotification = async (req: Request | any, res: Response | any, next: NextFunction) => {
      try {
            /** Get current user */
            let userObj: any = Object.assign({}, req.user)
            const query = { 'type': req.body.type, 'notification.title': req.body.title, userId: userObj._id }
            await notificationServices.updateNotification(query, { '$set': { 'notification.title': req.body.title, 'notification.description': req.body.description }})
            return res.status(200).send({ message: notificationsControllerResponse.updateNotificationSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

export {
      fetchNotifications,
      clearNotifications,
      updateUserNotification
}