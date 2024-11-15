import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { Types } from 'mongoose'

import bookSummaryService from '../../../services/customers/book/bookSummary.service'
import { responseMessage } from '../../../constants/message.constant'
import { getSearchRegexp } from '../../../lib/utils/utils';

const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

const getAllBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const authorSearchFilter: any = {}
        const bookSearchFilter: any = { status: 'Active', search: {} }
        if (params.category) {
            bookSearchFilter.search.categories = { $in: [new Types.ObjectId(params.category as any)] }
        }
        if (params.search) {
            bookSearchFilter.search.$or = [{ title: await getSearchRegexp(params.search) }]
            bookSearchFilter.search.$or.push({ 'author.name': await getSearchRegexp(params.search) })
            authorSearchFilter.name = await getSearchRegexp(params.search)
        }
        const bookSummariesList = await bookSummaryService.getAllBookSummariesForWebsite(bookSearchFilter, [['createdAt', 'desc']])
        response.status(200).json({ message: bookSummaryControllerResponse.fetchBookSummarySuccess, data: bookSummariesList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllBooks }
