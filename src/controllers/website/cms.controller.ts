import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import { responseMessage } from '../../constants/message.constant'
import { CmsModel } from '../../models';
const cmsControllerResponse = responseMessage.cmsControllerResponse

/** Get all cms */
const getAllCms = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const {title} = request.query;
        const languageId = (request as any).languageId

        const filter = {};

        if(title){
            filter['title'] = title
        }
        if(languageId){
            filter['language'] = languageId
        }

        const getAllCmsList = await CmsModel.find(filter).lean()
        response.status(200).json({ message: cmsControllerResponse.fetchCmsSuccess, data: getAllCmsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {getAllCms }
