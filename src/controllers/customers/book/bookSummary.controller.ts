import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookSummaryService from '../../../services/admin/book/bookSummary.service'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket, dataLimit } from '../../../constants/app.constant'
import { getSearchRegexp } from '../../../lib/utils/utils'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Get all book summary by for discover */
const getAllSummaries = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        let searchFilter: any = { status: 'Active' }
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'overview': await getSearchRegexp(params.search) },
                    { 'bookFor': await getSearchRegexp(params.search) }
                ],
                status: 'Active'
            }
        }
        if (params.category) {
            searchFilter = { categories: String(params.category) }
        }
        const data: any = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), searchFilter, [['createdAt', 'DESC']])
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
