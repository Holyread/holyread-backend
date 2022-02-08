import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookSummaryService from '../../../services/book/bookSummary.service'
import recommendedBookService from '../../../services/book/recommendedBook.service'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Get all book summary by filter */
const getAllSummaries = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        let searchFilter: any = { status: 'Active' }
        if (params.section === 'byCategory') {
            searchFilter = { categories: String(params.categories).split(','), status: 'Active' }
        }
        if (params.section === 'popular') {
            searchFilter = { popular: true, status: 'Active' }
        }
        if (params.section === 'recommended') {
            const recommendedBooks = await recommendedBookService.getAllRecommendedBooks(0, 0, {}, [['createdAt', 'DESC']])
            let data = recommendedBooks.recommendedBooks.map(item => {
                return {
                    _id: item.book._id,
                    title: item.book.title,
                    overview: item.book.overview,
                    author: item.book && item.book.author && item.book.author.name ? item.book.author.name : item.book.author,
                    coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + item.book.coverImage,
                    totalStar: 100,
                    totalReads: 100,
                    bookmark: true
                }
            })
            response.status(200).json({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data: { count: data.length, summaries: data } })
            return
        }
        const data: any = await bookSummaryService.getAllBookSummaries(0, 0, searchFilter, [['createdAt', 'DESC']])
        data.summaries = data.summaries.map((element: any) => {
            if (element && element.author && element.author.name) {
                element.author = element.author.name
            }
            return {
                _id: element._id,
                title: element.title,
                overview: element.overview,
                author: element && element.author && element.author.name ? element.author.name : element.author,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + element.coverImage,
                totalStar: 100,
                totalReads: 100,
                bookmark: true
            }
        });
        response.status(200).json({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data: data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one book summary by id */
const getOneSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get summary from db */
        const data: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        if (data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + data.coverImage
        }
        if (data.videoFile) {
            data.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + data.videoFile
        }
        if (data.chapters && data.chapters.length) {
            data.chapters.forEach(async oneChapter => {
                if (oneChapter.audioFile) {
                    oneChapter.audioFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/audio/' + oneChapter.audioFile
                }
            });
        }
        res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummarySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllSummaries, getOneSummary }
