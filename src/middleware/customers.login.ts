import { Response, NextFunction } from 'express'
import { encrypt } from '../lib/utils/utils'
import { UserModel } from '../models'
import Boom from '@hapi/boom'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req?.headers?.device) return next(Boom.forbidden('Access denied'));
        let query: any = { email: req.body?.email, password: encrypt(req.body?.password || '') }
        if (req.body?.id && req.body?.provider) {
            query = { 'oAuth.clientId': req.body.id, 'oAuth.provider': req.body?.provider }
        }
        const userDetails = await UserModel.findOne(query).select('maxDevices').lean().exec()
        
        if (
            userDetails &&
            userDetails?.maxDevices?.length >= 3 &&
            !userDetails?.maxDevices?.includes(req.headers.device)
        ) {
            return next(Boom.forbidden('Access denied'))
        }
        next()
        Promise.all([UserModel.findOneAndUpdate({ _id: userDetails._id }, { maxDevices: [...new Set([...userDetails.maxDevices || [], req.headers.device])] }, { new: true })]);
    } catch (error: any) {
        next(Boom.badRequest(error));
    }
}
