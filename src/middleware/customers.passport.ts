import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/utils/utils'
import { UserModel } from '../models'
import subscriptionService from '../services/stripe/subscription'
import Boom from '@hapi/boom'

export default async (req: any, res: Response, next: NextFunction): Promise<any> => {
    const accessToken: string | null = req.headers['x-access-token'] as string;
    if (!accessToken) {
        next(Boom.badRequest('Missing access token'));
    } else {
        try {
            const details: any = await verifyToken(accessToken)
            const userDetails = await UserModel.findOne({ $or: [{ email: details?.email }, { 'oAuth.clientId': details.oauthClientId }], _id: details.id, type: 'User' }).lean().exec()
            if (!userDetails) {
                next(Boom.badRequest('User not authorized'));
            }
            if (userDetails.status !== 'Active') {
                next(Boom.badRequest('User not active'));
            }
            const refUser: any = await UserModel.findOne({ _id: userDetails.referralUserId }).select('firstName lastName email').lean().exec()
            if (refUser) userDetails.referralUserId = refUser
            req.user = { ...userDetails, isNewLogin: eval(details?.isNewLogin) }
            global.currentUser = req.user;
            if (req?.user?.stripe?.subscriptionId) {
                const subscription = await subscriptionService.retrieveSubscription(req?.user?.stripe.subscriptionId)
                req.subscription = subscription
            }
            next();
        } catch (err: any) {
            next(Boom.badRequest(err));
        }
    }
}
