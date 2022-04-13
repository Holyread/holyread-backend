import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import { UserModel } from '../models'
import Boom from '@hapi/boom'

export default async (req: Request | any, res: Response, next: NextFunction): Promise<any> => {
    const accessToken: string | null = req.headers['x-access-token'] as string;

    if (!accessToken) {
        next(Boom.badRequest('Missing access token'));
    } else {
        try {
            const details = await verifyToken(accessToken)
            const userDetails = await UserModel.findOne({ email: details?.email, _id: details.id, type: 'Admin' }).lean().exec()
            if (!userDetails) {
                next(Boom.badRequest('Admin not authorized'));
            }
            if (!userDetails.verified) {
                next(Boom.badRequest('Admin not verified'));
            }
            req.user = userDetails
            next();
        } catch (err: any) {
            next(Boom.badRequest('Admin not authorized'));
        }
    }
}
