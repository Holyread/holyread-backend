import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookSummaryService from '../../../services/customers/book/bookSummary.service'
import bookAuthorService from '../../../services/admin/book/author.service'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket, dataLimit } from '../../../constants/app.constant'
import { getSearchRegexp, sentEmail, sortArrayObject } from '../../../lib/utils/utils'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse
const authControllerResponse = responseMessage.authControllerResponse

/** Get all book summary by for discover */
const getAllSummaries = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        let bookSearchFilter: any = { status: 'Active' }
        let authorSearchFilter: any = {}
        if (params.category) {
            bookSearchFilter.categories = String(params.category)
        }
        if (params.search) {
            bookSearchFilter.filter = String(params.search).toLowerCase().trim()
            authorSearchFilter.name = await getSearchRegexp(params.search)
        }
        if (params.author) {
            bookSearchFilter.author = params.author
        }
        const bookSummariesList: any = await bookSummaryService.getAllBookSummariesForDiscover(Number(skip), Number(limit), bookSearchFilter, [['createdAt', 'DESC']])
        if (params.author) {
            response.status(200).json({
                message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                data: bookSummariesList
            })
            return
        }
        const authorsList: any = await bookAuthorService.getAllAuthors(Number(skip), Number(limit), authorSearchFilter, [['createdAt', 'DESC']])
        response.status(200).json({
            message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
            data: { books: bookSummariesList, authors: authorsList }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one book summary by id */
const getOneSummary = async (req: any, res: Response, next: NextFunction) => {
    try {
        /** Get summary from db */
        const data: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: req.params.id })
        if (!data) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        let isPlanActive = false
        if ((req.subscription && req.subscription?.status === 'active') || (req.user.inAppSubscription && req.user.inAppSubscriptionStatus === 'Active')) {
            isPlanActive = true
        }
        if (!isPlanActive) {
            /** Set today start and end */
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            /** Filter current days reads books */
            let todayReads = req?.user?.library?.reading.filter(i => {
                const openAt = new Date(i.updatedAt).getTime()
                return openAt > start.getTime() && openAt < end.getTime() ? true : false
            })
            /** Slice today last 5 reads books only */
            todayReads = sortArrayObject(todayReads, 'updatedAt', 'desc').slice(0, 5)

            /** Throw if user access limit exceed */
            if (todayReads && todayReads.length === 5 && todayReads.find(i => String(i.bookId) !== String(data._id))) {
                return next(Boom.forbidden(bookSummaryControllerResponse.trailPlanLimitError))
            }
        }
        if (data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + data.coverImage
        }
        if (data.bookReadFile) {
            data.bookReadFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/reads/' + data.bookReadFile
        }
        if (data.videoFile) {
            data.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + data.videoFile
        }
        if (data?.chapters?.length) {
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

/**  Send Summary to kindle */
const sendSummaryToKindle = async (req: any, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        if (!req.user.kindleEmail) {
            return next(Boom.notFound(authControllerResponse.kindleEmailNotExistError))
        }
        /** Get summary from db */
        const data: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        if (!data.bookReadFile) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryDocFailure))
        }
        const fileLink = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/reads/' + data.bookReadFile
        const sentEmailRes = await sentEmail(req.user.kindleEmail, 'Convert', 'Sent book to kindle', data.bookReadFile, fileLink, true)
        if (!sentEmailRes) {
            return next(Boom.badRequest(bookSummaryControllerResponse.sendBookToKindleEmailFailure))
        }
        return res.status(200).send({ message: bookSummaryControllerResponse.sendBookToKindleSuccess })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllSummaries, getOneSummary, sendSummaryToKindle }
