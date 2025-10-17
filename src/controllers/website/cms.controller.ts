import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import cmsService from '../../services/customers/cms/cms.service'
import { responseMessage } from '../../constants/message.constant'

const cmsControllerResponse = responseMessage.cmsControllerResponse

/** Get all cms */
const getAllCms = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).language
        const getAllCmsList = await cmsService.getAllCms(language)
        response.status(200).json({ message: cmsControllerResponse.fetchAllCmsSuccess, data: getAllCmsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {getAllCms }
