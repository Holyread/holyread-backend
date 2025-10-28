import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import cmsService from '../../services/customers/cms/cms.service'
import { responseMessage } from '../../constants/message.constant'

const cmsControllerResponse = responseMessage.cmsControllerResponse

/** Get all cms */
const getAllCms = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const languageId = (request as any).languageId
        const getAllCmsList = await cmsService.getAllCms(languageId)
        response.status(200).json({ message: cmsControllerResponse.fetchAllCmsSuccess, data: getAllCmsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {getAllCms }
