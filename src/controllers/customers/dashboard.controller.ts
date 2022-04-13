import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookSummaryService from '../../services/customers/book/bookSummary.service'
import bookCategoryService from '../../services/customers/book/bookCategory.service'
import expertCuratedService from '../../services/customers/book/expertCurated.service'
import recommendedBookService from '../../services/customers/book/recommendedBook.service'
import readsOfDayService from '../../services/customers/readsOfDay/readsOfDay.service'
import smallGroupService from '../../services/customers/smallGroup/smallGroup.service'
import { responseMessage } from '../../constants/message.constant'
import { awsBucket, dataLimit } from '../../constants/app.constant'
import config from '../../../config'

const NODE_ENV = config.NODE_ENV
const dashboardControllerResponse = responseMessage.dashboardControllerResponse
const smallGroupControllerResponse = responseMessage.smallGroupControllerResponse

/** Get categories for dashboard */
const getCategories = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data: any = await bookCategoryService.getAllBookCategories(0, 0, { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data 
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get recent reads books for Dashboard */
const getRecentReads = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const recentReads: any = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), {}, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                recentReads
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get popular books for Dashboard */
const getPopularBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const mostPopular: any = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), { popular: true }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                mostPopular
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get curateds list for Dashboard */
const getCuratedsList = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const data: any = await expertCuratedService.getAllExpertCurateds(Number(skip), Number(limit), { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get reads of the day for Dashboard */
const getReadsOfTheDay = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const data: any = await readsOfDayService.getAllReadsOfDays(Number(skip), Number(limit), { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get recommended books for dashboard */
const getRecommendedBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const result = await recommendedBookService.getAllRecommendedBooks(Number(skip), Number(limit), {}, [])
        const recommendedBooks = []
        if (result && result.recommendedBooks && result.recommendedBooks.length) {
            result.recommendedBooks.map((oneBook: any) => {
                if (oneBook && oneBook.book && oneBook.book._id) {
                    recommendedBooks.push({
                        _id: oneBook.book._id,
                        coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneBook.book.coverImage,
                        coverImageBackground: oneBook.book.coverImageBackground,
                        title: oneBook.book.title,
                        author: oneBook.book.author,
                        overview: oneBook.book.overview,
                        totalStar: 100,
                        totalReads: 100
                    })
                } else {
                    --result.count
                }
            })
        }
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                recommendedBooks,
                count: result.count
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get small groups for Dashboard */
const getSmallGroups = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        if (params.id) {
            const data = await smallGroupService.getOneSmallGroupByFilter({ _id: params.id, status: 'Active' })
            response.status(200).json({
                message: smallGroupControllerResponse.fetchSmallGroupSuccess,
                data
            })
            return;
        }
        const data: any = await smallGroupService.getAllSmallGroups(Number(skip), Number(limit), { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get latest books for dashboard */
const getLatestBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const data: any = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), {}, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    getCategories,
    getCuratedsList,
    getLatestBooks,
    getPopularBooks,
    getReadsOfTheDay,
    getRecentReads,
    getRecommendedBooks,
    getSmallGroups
}
