import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import dailyDevotionalService from '../../../services/customers/book/dailyDevotional.service'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { responseMessage } from '../../../constants/message.constant'
const NODE_ENV = config.NODE_ENV
const readsOfDayControllerResponse = responseMessage.readsOfDayControllerResponse

/** Get all author options list */
const getOneDailyDevotional = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data = await dailyDevotionalService.getOneDailyDevotional({ _id: request.params.id })

        if (!data) {
            return next(
                Boom.notFound(
                    readsOfDayControllerResponse.getReadOfDayFailure
                )
            )
        }

        if (data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + data.image
        }
        response.status(200).json({ message: readsOfDayControllerResponse.fetchReadOfDaySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getOneDailyDevotional }
