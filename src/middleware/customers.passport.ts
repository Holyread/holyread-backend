import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import userService from '../services/users/user.service'
import Boom from '@hapi/boom'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    const accessToken: string | null = req.headers['x-access-token'] as string;
    const parentId: string | null = req.headers['parent-id'] as string;
    if (!parentId) {
        next(Boom.badRequest('Missing parent id'));
    }
    if (!accessToken) {
        next(Boom.badRequest('Missing access token'));
    } else {
        try {
            const details = await verifyToken(accessToken)
            const userDetails = await userService.getOneUserByFilter({ email: details?.email, type: 'User' })
            if (!userDetails) {
                next(Boom.badRequest('User not authorized'));
            }
            if (userDetails.type === 'Admin') {
                next(Boom.badRequest('User does not permitted to update parent'));
            }
            const parentDetails = await userService.getOneUserByFilter({ _id: parentId, type: 'Admin' })
            if (!parentDetails) {
                next(Boom.badRequest('Parent details not found'));
            }
            req.user = userDetails
            next();
        } catch (err: any) {
            next(Boom.badRequest('User not authorized'));
        }
    }
}
