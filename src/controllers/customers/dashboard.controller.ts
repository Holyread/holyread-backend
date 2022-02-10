import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookSummaryService from '../../services/book/bookSummary.service'
import bookCategoryService from '../../services/book/bookCategory.service'
import expertCuratedService from '../../services/book/expertCurated.service'
import recommendedBookService from '../../services/book/recommendedBook.service'
import readsOfDayService from '../../services/readsOfDay/readsOfDay.service'
import smallGroupService from '../../services/smallGroup/smallGroup.service'
import { responseMessage } from '../../constants/message.constant'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'

const NODE_ENV = config.NODE_ENV
const dashboardControllerResponse = responseMessage.dashboardControllerResponse

/** Get Dashboard */
const getDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const categories: any = await bookCategoryService.getAllBookCategory(0, 0, { status: 'Active' }, [['createdAt', 'DESC']], true)
        const readsOfTheDayList: any = await readsOfDayService.getAllReadsOfDay(0, 10, { status: 'Active' }, [['createdAt', 'DESC']], true)
        const recommendedBooksList = await recommendedBookService.getAllRecommendedBooks(0, 10, {}, [], true)
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
        const mostPopular: any = await bookSummaryService.getAllBookSummaries(0, 10, { popular: true }, [['createdAt', 'DESC']], true)
        const books: any = await bookSummaryService.getAllBookSummaries(0, 10, {}, [['createdAt', 'DESC']], true)
        const curatedList: any = await expertCuratedService.getAllExpertCurated(0, 10, { status: 'Active' }, [['createdAt', 'DESC']], true)
        const smallGroupsList: any = await smallGroupService.getAllSmallGroups(0, 10, { status: 'Active' }, [['createdAt', 'DESC']], true)
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                categories,
                recentReads: books,
                mostPopular,
                curatedList,
                readsOfTheDayList,
                recommendedBooks,
                latest: books,
                smallGroups: smallGroupsList
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getDashboard }
