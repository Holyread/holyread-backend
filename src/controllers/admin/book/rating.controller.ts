import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import ratingService from '../../../services/admin/book/rating.service'
import { responseMessage } from '../../../constants/message.constant'
import { dataTable } from '../../../constants/app.constant'

const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Get all Ratings */
const getAllRatings = async (request: Request | any, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        const searchFilter: any = {}
        if (params.star) {
            searchFilter.star = params.star
        }
        if (params.search) {
            searchFilter.search = params.search.trim().toLowerCase()
        }
        if (params.bookId) {
            searchFilter.bookId = params.bookId
        }
        let sorting = { column: 'star', order: 'desc' };

        switch (params.column) {
            case 'star':
                sorting = { column: 'star', order: params.order || 'desc' };
                break;
            case 'bookTitle':
                sorting = { column: 'bookTitle', order: params.order || 'asc' };
                break;
            case 'ratings':
                sorting = { column: 'ratings', order: params.order || 'asc' };
                break;
            case 'user':
                sorting = searchFilter.bookId ? { column: 'user', order: params.order || 'asc' } : sorting;
                break;
            default:
                break;
        }
        const data = searchFilter.bookId
            ? await ratingService.getBookRatings(Number(skip), Number(limit), searchFilter, sorting)
            : await ratingService.getAllRatings(Number(skip), Number(limit), searchFilter, sorting)
        response.status(200).json({ message: bookSummaryControllerResponse.getBookRatingsSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllRatings }
