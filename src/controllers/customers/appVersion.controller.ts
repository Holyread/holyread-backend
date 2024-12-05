import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import appVersionService from '../../services/customers/appVersion/appVersion.service'
import { responseMessage } from '../../constants/message.constant'

const appVersionControllerResponse = responseMessage.appVersionControllerResponse

/** Get all appVersion */
const getLatestAppVersion = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data = await appVersionService.getOneAppVersionByFilter({ platform: request.query.platform })
        response.status(200).json({ message: appVersionControllerResponse.fetchAllAppVersionSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getLatestAppVersion }
