import { Response, NextFunction } from 'express'
import Boom from '@hapi/boom'

import { encrypt, getToken } from '../lib/utils/utils'
import { SettingModel, UserModel } from '../models'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req?.headers?.device)
            return next(Boom.notFound('Device details are missing'));

        let query: any = {
            email: req.body?.email,
            password: encrypt(req.body?.password || '')
        }

        if (req.body?.id && req.body?.provider) {
            query = {
                'oAuth.clientId': req.body.id,
                'oAuth.provider': req.body?.provider
            }
        }

        const userDetails = await UserModel.findOne(query).select('maxDevices email').lean().exec();
        const settings = await SettingModel.findOne({}).select('maxDeviceLogin').lean().exec();
        if (
            userDetails &&
            (userDetails?.maxDevices?.length >= (settings?.maxDeviceLogin || 3)) &&
            !userDetails?.maxDevices?.includes(req.headers.device)
        ) {
            const token: string = getToken({
                email: userDetails.email,
                id: userDetails._id
            })

            return next(
                Boom.forbidden(
                    'Device limit reached, please logout from previews one device',
                    {
                        token,
                        devices: userDetails?.maxDevices
                    }
                )
            )
        }
        next();

        Promise.all([
            UserModel.findOneAndUpdate(
                { _id: userDetails?._id },
                { 
                    maxDevices: [
                        ...new Set([
                            ...userDetails?.maxDevices || [],
                            req.headers.device
                        ])
                    ]
                }
            )
        ]);
    } catch (error: any) {
        next(Boom.badRequest(error));
    }
}
