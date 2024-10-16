import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import { SettingModel, UserModel } from '../models'
import Boom from '@hapi/boom'
import { ISetting } from '../models/setting.model'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    const accessToken: string | null = req.headers['x-access-token'] as string;
    if (!accessToken) {
        next(Boom.badRequest('Missing access token'));
    } else {
        try {
            if (false && !req?.headers?.device)
                return next(Boom.notFound('Device details are missing'));

            const details: any = await verifyToken(accessToken)
            const userDetails: any
                = await UserModel.findOne({
                    $or: [
                        { 'oAuth.clientId': details.oauthClientId },
                        { email: details?.email },
                    ],
                    _id: details.id,
                    type: 'User',
                })
                    .lean()
                    .exec();

            const { maxDeviceLogin } = await SettingModel
                .findOne({})
                .select('maxDeviceLogin')
                .lean()
                .exec() as ISetting;

            if (!userDetails) {
                return next(Boom.unauthorized('User not authorized'));
            }
            if (userDetails.status !== 'Active') {
                return next(Boom.unauthorized('User not active'));
            }
            // if (!userDetails.verified) {
            //     return next(Boom.forbidden('User not verfied'));
            // }
            if (
                false &&
                !req.path.includes('logout') &&
                !userDetails.maxDevices.includes(req?.headers?.device) &&
                userDetails?.maxDevices?.length >= (maxDeviceLogin || 3)
            ) {
                return next(
                    Boom.forbidden(
                        'You have used this Holy Reads account on 3 devices. Please log out from one of your devices and try again.'
                    )
                );
            }

            const refUser: any = await UserModel.findOne({
                _id: userDetails.referralUserId,
            }).select('firstName lastName email').lean().exec();

            if (refUser) { userDetails.referralUserId = refUser }

            /** set new login flag for new user first login let's start popup */
            req.user = { ...userDetails, isNewLogin: !userDetails.lastSeen }

            global.currentUser = req.user;

            next();

        } catch (err: any) {
            next(Boom.unauthorized(err));
        }
    }
}
