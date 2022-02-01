import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookSummaryService from '../../services/book/bookSummary.service'
import bookCategoryService from '../../services/book/bookCategory.service'
import expertCuratedService from '../../services/book/expertCurated.service'
import recommendedBookService from '../../services/book/recommendedBook.service'
import readsOfDayService from '../../services/readsOfDay/readsOfDay.service'
import { responseMessage } from '../../constants/message.constant'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'

const NODE_ENV = config.NODE_ENV
const dashboardControllerResponse = responseMessage.dashboardControllerResponse

/** Get Dashboard */
const getDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const bookSummaryList: any = await bookSummaryService.getAllBookSummaries(0, 0, {}, [['createdAt', 'DESC']])
        const bookCategoriesList: any = await bookCategoryService.getAllBookCategory(0, 0, { status: 'Active' }, [])
        const categories = bookCategoriesList.categories.map(oneCategory => {
            return {
                _id: oneCategory._id,
                title: oneCategory.title,
                image: oneCategory.image
            }
        })
        const sharedImages = []
        const readsOfDayList = await readsOfDayService.getAllReadsOfDay(0, 0, { status: 'Active' }, [['createdAt', 'DESC']])
        readsOfDayList.reads.forEach(oneReads => {
            sharedImages.push({
                title: oneReads.title,
                image: oneReads.image,
                subTitle: oneReads.subTitle
            })
        });
        const recommendedBooksList = await recommendedBookService.getAllRecommendedBooks(0, 0, {}, [])
        const recommendedBooks = []
        recommendedBooksList.recommendedBooks.forEach((oneBook: any) => {
            if (oneBook && oneBook.book && oneBook.book._id) {
                recommendedBooks.push({
                    _id: oneBook.book._id,
                    coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneBook.book.coverImage,
                    title: oneBook.book.title,
                    author: oneBook.author,
                    overview: oneBook.book.overview,
                    totalStar: 100,
                    totalReads: 100
                })
            }
        })
        const mostPopular = []
        const recentReads = []
        bookSummaryList.summaries.forEach(oneSummary => {
            if (oneSummary && oneSummary.popular) {
                mostPopular.push({
                    coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneSummary.coverImage,
                    title: oneSummary.title,
                    author: oneSummary.author,
                    overview: oneSummary.overview,
                    totalStar: 100,
                    totalReads: 100,
                    bookMark: true
                })
            }
            if (recentReads.length < 10) {
                recentReads.push({
                    coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneSummary.coverImage,
                    title: oneSummary.title,
                    author: oneSummary.author,
                    overview: oneSummary.overview,
                    totalStar: 100,
                    totalReads: 100,
                    bookMark: true
                })
            }
        })
        const curatedList = [];
        const expertCuratedList = await expertCuratedService.getAllExpertCurated(0, 0, { status: 'Active' }, [])
        expertCuratedList.data.forEach(element => {
            if (element) {
                curatedList.push({
                    title: element.title,
                    description: element.description,
                    shortDescription: element.shortDescription,
                    image: element.image,
                    totalReads: 100
                })
            }
        });
        const latestBooks = []
        bookSummaryList.summaries.slice(0, 10).forEach(oneSummary => {
            if (oneSummary) {
                latestBooks.push({
                    coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneSummary.coverImage,
                    title: oneSummary.title,
                    author: oneSummary.author,
                    overview: oneSummary.overview,
                    totalStar: 100,
                    totalReads: 100,
                    bookMark: true
                })
            }
        })
        const smallGroups = []
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                categories,
                recentReads,
                sharedImages: [],
                mostPopular,
                curatedList,
                latest: latestBooks,
                smallGroups
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getDashboard }
