import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import subscriptionsService from '../../services/customers/subscriptions/subscriptions.service'
import { responseMessage } from '../../constants/message.constant'

const subscriptionsControllerResponse = responseMessage.subscriptionsControllerResponse

/** Get all Subscriptions */
const getAllSubscriptions = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const getSubscriptionsList = await subscriptionsService.getAllSubscriptions({ status: 'Active' })
        response.status(200).json({ message: subscriptionsControllerResponse.fetchSubscriptionsSuccess, data: getSubscriptionsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllSubscriptions }
