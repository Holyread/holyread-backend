import { NextFunction } from 'express';
import { verifyToken } from '../lib/utils/utils';
import { UserModel, NotificationsModel } from '../models';

export default async (socket: any, next: NextFunction): Promise<void> => {
    try {
        if (!socket.handshake.query || !socket.handshake.query.token) {
            console.log('User not authorized: No token provided');
            return next(new Error('User not authorized'));
        }

        let details: any;
        try {
            details = verifyToken(socket.handshake.query.token);
        } catch (error: any) {
            console.error('Token verification error:', error.message);
            return next(new Error('User not authorized'));
        }

        const userDetails: any = await UserModel
            .findOne({
                $or: [
                    { email: details?.email },
                    { 'oAuth.clientId': details.oauthClientId },
                ],
                _id: details.id,
                type: 'User',
            })
            .lean().exec();

        if (!userDetails) {
            console.log('User not authorized: User not found');
            return next(new Error('User not authorized'));
        }

        const notificationsDetails = await NotificationsModel
            .find({ userId: userDetails._id })
            .sort([['createdAt', 'desc']])
            .lean().exec();

        userDetails.notifications = notificationsDetails;
        socket.user = userDetails;
        next();

    } catch (error: any) {
        console.error('Authorization error:', error.message);
        return next(new Error('User not authorized'));
    }
};
