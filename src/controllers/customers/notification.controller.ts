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

/** create user notification */
const createUserNotification = async (req: Request | any, res: Response | any, next: NextFunction) => {
      try {
            await notificationServices.createNotification({ notification: { title: req.body.title, description: req.body.description }, type: req.body.type, userId: req.user._id })
            return res.status(200).send({ message: notificationsControllerResponse.createNotificationSuccess })
      } catch (e: any) {
            return next(Boom.badData(e.message))
      }
}

export {
      fetchNotifications,
      clearNotifications,
      createUserNotification
}