import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookCategoryService from '../../../services/customers/book/bookCategory.service'
import { responseMessage } from '../../../constants/message.constant'

const bookCategoryControllerResponse = responseMessage.bookCategoryControllerResponse

/** Get all book category by filter */
const getAllCategory = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const languageId = (request as any).languageId

        const data = await bookCategoryService.getAllBookCategories(0, 0, {}, { createdAt: -1.0 }, languageId)
        response.status(200).json({ message: bookCategoryControllerResponse.fetchBookCategoriesSuccess, data: data.categories })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllCategory }
