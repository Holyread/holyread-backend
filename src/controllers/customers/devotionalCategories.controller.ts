import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import { responseMessage } from '../../constants/message.constant'
import { DevotionalCategoryModel } from '../../models/devotionalCategory.model';

const { authControllerResponse } = responseMessage

/** Get all devotional categories */
const getAllDevotionalCategories = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).user.language
        const devotionalCategories = await DevotionalCategoryModel.find({ language }).select('name image description')
        response.status(200).json({ message: authControllerResponse.getDevotionalCategorySuccess, data: devotionalCategories })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllDevotionalCategories }
