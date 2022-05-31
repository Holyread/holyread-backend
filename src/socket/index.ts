import { fetchNotifications, clearNotifications } from '../controllers/customers/notification.controller';

module.exports = (io) => {
      io.on('connection', socket => {
            socket.on('fetchNotifications', (query) => fetchNotifications(socket, query));
            socket.on('clearNotifications', (query) => clearNotifications(socket, query));
            socket.on('disconnect', () => console.log('disconnected'));
      })
}