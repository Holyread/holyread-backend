import { NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import { UserModel, NotificationsModel } from '../models'

export default async (socket: any, next: NextFunction): Promise<any> => {
    if (!socket.handshake.query || !socket.handshake.query.token) {
        console.log('User not authorized')
        return next(new Error('User not authorized'));
    }
    const details:  any = await verifyToken(socket.handshake.query.token)
    const userDetails: any
        = await UserModel
            .findOne({
                $or: [
                    { email: details?.email },
                    { 'oAuth.clientId': details.oauthClientId }
                ],
                _id: details.id,
                type: 'User'
            })
            .lean().exec()
    if (!userDetails) {
        console.log('User not authorized')
        return next(new Error('User not authorized'));
    }
    const notificationsDetails = await NotificationsModel.find({ userId: userDetails._id }).sort([['createdAt', 'DESC']]).lean().exec()
    userDetails.notifications = notificationsDetails
    socket.user = userDetails
    next();
}
