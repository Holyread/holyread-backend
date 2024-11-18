import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import subscriberService from '../../services/website/subscriber/subscriber.service';

import { responseMessage } from '../../constants/message.constant'

const subScriberControllerResponse = responseMessage.subScriberControllerResponse


/** Add subscriber */
const addSubscriber = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const subscriberObj: any = await subscriberService.getOneSubscriberByFilter({ email: body.email })
        if (subscriberObj) return next(Boom.conflict(subScriberControllerResponse.createSubscriberFailure))

        await subscriberService.createSubscriber(body)
        res.status(200).send({
            message: subScriberControllerResponse.createSubscriberSuccess,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { addSubscriber }
