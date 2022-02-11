import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import userService from '../services/admin/users/user.service'
import Boom from '@hapi/boom'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    const accessToken: string | null = req.headers['x-access-token'] as string;
    if (!accessToken) {
        next(Boom.badRequest('Missing access token'));
    } else {
        try {
            const details = await verifyToken(accessToken)
            const userDetails = await userService.getOneUserByFilter({ email: details?.email, type: 'User' })
            if (!userDetails) {
                next(Boom.badRequest('User not authorized'));
            }
            if (userDetails.status !== 'Active') {
                next(Boom.badRequest('User not active'));
            }
            req.user = userDetails
            next();
        } catch (err: any) {
            next(Boom.badRequest('User not authorized'));
        }
    }
}
