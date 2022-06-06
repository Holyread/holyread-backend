import userServices from '../../services/customers/users/user.service'
import notificationServices from '../../services/customers/notifications/notifications.service'

const fetchNotifications = async (socket, query) => {
      userServices.getOneUserByFilter(query).then(res => {
            socket.emit('fetchNotifications', res?.notifications || [])
      })
}

const clearNotifications = async (socket, query) => {
      await notificationServices.deleteNotifications({ userId: socket.user._id }).then(res => {
            fetchNotifications(socket, query)
      })
}

export {
      fetchNotifications,
      clearNotifications
}