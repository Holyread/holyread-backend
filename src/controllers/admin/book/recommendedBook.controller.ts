import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import recommendedBookService from '../../../services/book/recommendedBook.service'
import bookSummaryService from '../../../services/book/bookSummary.service'
import { responseMessage } from '../../../constants/message.constant'
import { getSearchRegexp } from '../../../lib/utils/utils'
import { dataTable } from '../../../constants/app.constant'

const recommendedBookControllerResponse = responseMessage.recommendedBookControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Add recommended book  */
const addRecommendedBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const bookDetails = await bookSummaryService.getOneBookSummaryByFilter({ _id: body.book })
        if (!bookDetails) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        const existingRecommendedBook = await recommendedBookService.getOneRecommendedBookByFilter({ book: body.book })
        if (existingRecommendedBook) {
            res.status(200).send({
                message: recommendedBookControllerResponse.createRecommendedBookSuccess,
                data: existingRecommendedBook
            })
            return;
        }
        const data = await recommendedBookService.createRecommendedBook(body)
        res.status(200).send({
            message: recommendedBookControllerResponse.createRecommendedBookSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one recommended book by id */
const getOneRecommendedBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get author from db */
        const data: any = await recommendedBookService.getOneRecommendedBookByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(recommendedBookControllerResponse.getRecommendedBookFailure))
        }
        res.status(200).send({
            message: recommendedBookControllerResponse.fetchRecommendedBookSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all recommended books */
const getAllRecommendedBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = { "book.title": await getSearchRegexp(params.search) }
        }
        const listSorting = [];
        switch (params.column) {
            case 'book':
                listSorting.push(['book.title', params.order || 'ASC']);
                break;
            case 'createdAt':
                listSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                listSorting.push(['createdAt', 'DESC']);
                break;
        }

        const data = await recommendedBookService.getAllRecommendedBooks(Number(skip), Number(limit), searchFilter, listSorting)
        response.status(200).json({ message: recommendedBookControllerResponse.fetchRecommendedBooksSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Delete recommended book */
const deleteRecommendedBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        await recommendedBookService.deleteRecommendedBook(id)
        return res.status(200).send({ message: recommendedBookControllerResponse.deleteRecommendedBookSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addRecommendedBook, getOneRecommendedBook, getAllRecommendedBooks, deleteRecommendedBook }
