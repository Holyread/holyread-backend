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
import stripeSubscriptionService from '../../../services/stripe/subscription';

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
        const bookSummariesList: any = await bookSummaryService.getAllBookSummariesForDiscover(Number(skip), Number(limit), bookSearchFilter, [['createdAt', 'desc']])
        if (params.author) {
            response.status(200).json({
                message: bookSummaryControllerResponse.fetchBookSummariesSuccess,
                data: bookSummariesList,
            })
            return
        }
        const authorsList: any = await bookAuthorService.getAllAuthors(Number(skip), Number(limit), authorSearchFilter, [['createdAt', 'desc']])
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
        let isPlanActive = false
        let isPlanExpired = false
        if (
            req.user.inAppSubscription &&
            [
                'active',
                'subscribed',
                'did_renew',
                'offer_redeemed',
            ].includes(
                req.user?.inAppSubscriptionStatus?.toLowerCase()
            )
        ) {
            isPlanActive = true
            // todo: count duration with createdAt
            // if duration already ended
            // then mark plan as inactive
        } else if (
            req.user.inAppSubscription &&
            ![
                'active',
                'subscribed',
                'did_renew',
                'offer_redeemed',
            ].includes(
                req.user?.inAppSubscriptionStatus?.toLowerCase()
            )
        ) {
            isPlanExpired = true
        }

        if (!isPlanActive && req.user?.stripe?.subscriptionId) {
            try {
                const s = await stripeSubscriptionService
                    .retrieveSubscription(
                        req.user.stripe.subscriptionId
                    )
                isPlanActive = s?.status === 'active'
                isPlanExpired = !['active', 'trialing'].includes(s?.status?.toLowerCase())
            } catch (e: any) {
                next(Boom.badData(e.message))
            }
        }
        /*if (
            !req.user.inAppSubscription &&
            !req.user?.stripe?.subscriptionId &&
            new Date(
                req.user.createdAt
            )
            .getTime()
            <
            new Date()
                .setDate(
                    new Date().getDate() - trailDays
                )
        ) {
            isPlanExpired = true;
        }*/

        /*if (isPlanExpired) {
            return next(
                Boom.forbidden(
                    bookSummaryControllerResponse.planExpiredError
                )
            )
        }*/

        if (!isPlanActive || isPlanExpired) {
            /** Set today start and end */
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            /** Filter current days new view books */
            const todayViews: any = []; let isExist = false;
            const todayFreeNotificationBook: any = []; let isFreeNotificationBookExist = false
            const library: any = await userService.getUserLibrary({ _id: req.user.libraries })
            library?.view.map(i => {
                const createdAt = new Date(i.createdAt).getTime();
                if (createdAt >= start.getTime()) todayViews.push(i)
                if (String(i.bookId) === String(data._id)) {
                    isExist = true
                }
            })

            /** Filter current days notification book view */
            library?.freeNotificationBooks.map(i => {
                const createdAt = new Date(i.createdAt).getTime();
                if (createdAt >= start.getTime()) todayFreeNotificationBook.push(i)
                if (String(i.bookId) === String(data._id)) {
                    isFreeNotificationBookExist = true
                }
            })

            const categoryIds = library.categories.map(id => id.toString()) || [];

            // Filter categories to find any matches between user library categories and data categories
            const matchingCategories = categoryIds.filter(categoryId =>
                data.categories.map(id => id.toString()).includes(categoryId)
            );

            // Fetch the user's library based on the library ID and the freeSummary ID from request parameters
            const freeSummary = await userService.getUserLibrary({ _id: library, freeSummary: req.params.id })

            // Check if the user has already used the free summary, is not signed up, and the free summary doesn't exist
            if (req.user.hasUsedFreeSummary && !req.user.isSignedUp && !freeSummary) {
                return next(Boom.forbidden(bookSummaryControllerResponse.preSignedUpUserSummaryLimitError))
            }

            // If no matching categories are found, the user has used the free summary, and the free summary doesn't exist
            if (matchingCategories.length === 0 && req.user.hasUsedFreeSummary && !freeSummary) {
                return next(Boom.forbidden(bookSummaryControllerResponse.noMatchCategories))
            }

            // If the free summary does not exist, today's views are 2 or more, the user has no free notification books, and the free summary doesn't exist
            if (!isExist && todayViews.length >= 2 && library?.freeNotificationBooks.length === 0 && !freeSummary) {
                return next(Boom.forbidden(bookSummaryControllerResponse.trialPlanLimitError))
            }

            // If the free summary does not exist, today's views are 1 or more, the free notification book does not exist, and the free summary doesn't exist
            if (!isExist 
                && todayViews.length >= 1 
                && !isFreeNotificationBookExist 
                && library?.freeNotificationBooks.length > 0 
                && !freeSummary 
                && library?.reading.some(book => book.chaptersCompleted.length > 4)
            ) {
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
