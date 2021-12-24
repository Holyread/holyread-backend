import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import userService from '../services/users/user.service'
import Boom from '@hapi/boom'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    const accessToken: string | null = req.headers['x-access-token'] as string;

    if (!accessToken) {
        next(Boom.badRequest('Missing access token'));
    } else {
        try {
            const details = await verifyToken(accessToken)
            const userDetails = await userService.getOneUserByFilter({ email: details?.email, type: 'Admin' })
            if (!userDetails) {
                throw new Error('Admin not authorized');
            }
            req.user = userDetails
            next();
        } catch (err: any) {
            next(Boom.badRequest('Admin not authorized'));
        }
    }
}
