import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import { responseMessage } from '../../constants/message.constant'

const { authControllerResponse } = responseMessage
import { devotionalCategoriesList } from '../../lib/utils/utils.js'

/** Get all devotional categories */
const getAllDevotionalCategories = async (request: Request, response: Response, next: NextFunction) => {
    try {
        response.status(200).json({ message: authControllerResponse.getDevotionalCategorySuccess, data: devotionalCategoriesList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllDevotionalCategories }
