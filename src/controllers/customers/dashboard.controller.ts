import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookSummaryService from '../../services/customers/book/bookSummary.service'
import bookCategoryService from '../../services/customers/book/bookCategory.service'
import expertCuratedService from '../../services/customers/book/expertCurated.service'
import recommendedBookService from '../../services/customers/book/recommendedBook.service'
import readsOfDayService from '../../services/customers/readsOfDay/readsOfDay.service'
import smallGroupService from '../../services/customers/smallGroup/smallGroup.service'
import { responseMessage } from '../../constants/message.constant'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'

const NODE_ENV = config.NODE_ENV
const dashboardControllerResponse = responseMessage.dashboardControllerResponse

/** Get categories for dashboard */
const getCategories = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const categories: any = await bookCategoryService.getAllBookCategories(0, 0, { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: categories
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get recent reads books for Dashboard */
const getRecentReadsBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const recentReads: any = await bookSummaryService.getAllBookSummaries(0, 10, {}, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: recentReads
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get popular books for Dashboard */
const getPopularBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const mostPopular: any = await bookSummaryService.getAllBookSummaries(0, 10, { popular: true }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: mostPopular
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get curuted list for Dashboard */
const getCurutedList = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const curatedList: any = await expertCuratedService.getAllExpertCurateds(0, 10, { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: curatedList
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get reads of the day for Dashboard */
const getReadsOfTheDay = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const readsOfTheDayList: any = await readsOfDayService.getAllReadsOfDays(0, 10, { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: readsOfTheDayList
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get recommended books for dashboard */
const getRecommendedBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const recommendedBooksList = await recommendedBookService.getAllRecommendedBooks(0, 10, {}, [])
        const recommendedBooks = []
        if (recommendedBooksList && recommendedBooksList.length) {
            recommendedBooksList.map((oneBook: any) => {
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
                }
            })
        }
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: recommendedBooks,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get small groups for Dashboard */
const getSmallGroups = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const smallGroupsList: any = await smallGroupService.getAllSmallGroups(0, 10, { status: 'Active' }, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: smallGroupsList
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get latest books for dashboard */
const getLatestBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const books: any = await bookSummaryService.getAllBookSummaries(0, 10, {}, [['createdAt', 'DESC']])
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: books
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    getCategories,
    getCurutedList,
    getLatestBooks,
    getPopularBooks,
    getReadsOfTheDay,
    getRecentReadsBooks,
    getRecommendedBooks,
    getSmallGroups
}
