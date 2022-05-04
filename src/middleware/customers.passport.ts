import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import { UserModel } from '../models'
import Boom from '@hapi/boom'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    const accessToken: string | null = req.headers['x-access-token'] as string;
    if (!accessToken) {
        next(Boom.badRequest('Missing access token'));
    } else {
        try {
            const details = await verifyToken(accessToken)
            const userDetails = await UserModel.findOne({ $or: [{ email: details?.email }, { authId: details.authId }], _id: details.id, type: 'User' }).lean().exec()
            if (!userDetails) {
                next(Boom.badRequest('User not authorized'));
            }
            if (userDetails.status !== 'Active') {
                next(Boom.badRequest('User not active'));
            }
            req.user = userDetails
            global.currentUser = req.user;
            next();
        } catch (err: any) {
            next(Boom.badRequest(err));
        }
    }
}
