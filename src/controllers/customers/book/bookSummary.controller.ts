import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { Types } from 'mongoose'

import bookSummaryService from '../../../services/customers/book/bookSummary.service'
import bookAuthorService from '../../../services/admin/book/author.service'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket, dataLimit, originEmails } from '../../../constants/app.constant'
import { getSearchRegexp, sentEmail } from '../../../lib/utils/utils'
import config from '../../../../config'
import userService from '../../../services/customers/users/user.service';
import subscriptionsService from '../../../services/customers/subscriptions/subscriptions.service';

const NODE_ENV = config.NODE_ENV
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse
const authControllerResponse = responseMessage.authControllerResponse

/** Get all book summary by for discover */
const getAllSummaries = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const bookSearchFilter: any = { status: 'Active', search: {} }
        const language = (request as any).user.language;
        const authorSearchFilter: any = {}
        if (params.category) {
            bookSearchFilter.search.categories = { $in: [new Types.ObjectId(params.category as any)] }
        }
        if (params.search) {
            bookSearchFilter.search.$or = [{ title: await getSearchRegexp(params.search) }]
            bookSearchFilter.search.$or.push({ 'author.name': await getSearchRegexp(params.search) })
            authorSearchFilter.name = await getSearchRegexp(params.search)
        }
        if (params.author) {
            bookSearchFilter.search['author._id'] = new Types.ObjectId(params.author as string)
        }
        const bookSummariesList: any = await bookSummaryService.getAllBookSummariesForDiscover(Number(skip), Number(limit), bookSearchFilter, [['createdAt', 'desc']], language)
        if (params.author) {
            response.status(200).json({
                message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                data: bookSummariesList,
            })
            return
        }
        const authorsList: any = await bookAuthorService.getAllAuthors(Number(skip), Number(limit), authorSearchFilter, [['createdAt', 'desc']], language)
        response.status(200).json({
            message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
            data: { books: bookSummariesList, authors: authorsList },
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
        // Straight rule, no trial mode: a free (non-subscribed) user gets
        // exactly 1 book/summary per calendar day. Revisiting the same book
        // again the same day is always allowed; a different book once
        // today's one has already been used is not. Subscribed users skip
        // this entirely.
        const subscriptionStatus = await subscriptionsService.getUserSubscriptionStatus(req.user)

        if (subscriptionStatus === 'freemium') {
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const library: any = await userService.getUserLibrary({ _id: req.user.libraries })

            const todayViews = (library?.view || []).filter(
                i => new Date(i.createdAt).getTime() >= start.getTime()
            )
            const alreadyViewedThisBookToday = todayViews.some(
                i => String(i.bookId) === String(data._id)
            )

            if (!alreadyViewedThisBookToday && todayViews.length >= 1) {
                return next(Boom.forbidden(bookSummaryControllerResponse.trialPlanLimitError));
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

        if (req.user?.libraries?._id) {
            req.user.libraries = await userService.getUserLibrary({ _id: req.user.libraries }, ['view'])
        }

        const bookId = String(req.params.id);

        /** Check if the book has already been viewed */
        const hasViewed = req.user.libraries?.view?.some(i => String(i.bookId) === bookId);

        if (!hasViewed) {
            await bookSummaryService.updateBookSummary({ '$inc': { views: 1 } }, { _id: bookId });
        }
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Send Summary to kindle */
const sendSummaryToKindle = async (req: any, res: Response, next: NextFunction): Promise<any> => {
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

        const sentEmailRes = await sentEmail({
            fileLink,
            subject: 'Convert',
            sentToKindle: true,
            to: req.user.kindleEmail,
            from: originEmails.kindle,
            html: 'Sent book to kindle',
            fileName: data.bookReadFile,
        })

        if (!sentEmailRes) {
            return next(Boom.badRequest(bookSummaryControllerResponse.sendBookToKindleEmailFailure))
        }
        return res.status(200).send({ message: bookSummaryControllerResponse.sendBookToKindleSuccess })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllSummaries, getOneSummary, sendSummaryToKindle }
