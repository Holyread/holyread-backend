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
        const bookCategoriesList: any = await bookCategoryService.getAllBookCategory(0, 0, { status: 'Active' }, [['createdAt', 'DESC']])
        const categories = bookCategoriesList.categories.map(oneCategory => {
            return {
                _id: oneCategory._id,
                title: oneCategory.title,
                image: oneCategory.image
            }
        })
        const readsOfTheDay = []
        const readsOfDayList = await readsOfDayService.getAllReadsOfDay(0, 10, { status: 'Active' }, [['createdAt', 'DESC']])
        readsOfDayList.reads.forEach(oneReads => {
            readsOfTheDay.push({
                title: oneReads.title,
                image: oneReads.image,
                subTitle: oneReads.subTitle
            })
        });
        const recommendedBooksList = await recommendedBookService.getAllRecommendedBooks(0, 10, {}, [])
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
        let mostPopular: any = await bookSummaryService.getAllBookSummaries(0, 10, { popular: true }, [['createdAt', 'DESC']])
        let books: any = await bookSummaryService.getAllBookSummaries(0, 10, {}, [['createdAt', 'DESC']])
        mostPopular = mostPopular.summaries.map(oneItem => {
            return {
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                author: oneItem.author,
                overview: oneItem.overview,
                totalStar: 100,
                totalReads: 100,
                bookMark: true,
                coverImageBackground: oneItem.coverImageBackground
            }
        })
        const latestBooks = books.summaries.map(oneItem => {
            return {
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                author: oneItem.author,
                overview: oneItem.overview,
                totalStar: 100,
                totalReads: 100,
                bookMark: true,
                coverImageBackground: oneItem.coverImageBackground
            }
        })
        const recentReads = books.summaries.map(oneItem => {
            return {
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                author: oneItem.author,
                overview: oneItem.overview,
                totalStar: 100,
                totalReads: 100,
                bookMark: true,
                coverImageBackground: oneItem.coverImageBackground
            }
        })
        const curatedList = [];
        const expertCuratedList = await expertCuratedService.getAllExpertCurated(0, 10, { status: 'Active' }, [['createdAt', 'DESC']])
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

        let smallGroupsList: any = await smallGroupService.getAllSmallGroups(0, 10, { status: 'Active' }, [['createdAt', 'DESC']])
        smallGroupsList = smallGroupsList.smallGroups.map(element => {
            return {
                iceBreaker: element.iceBreaker,
                introduction: element.introduction,
                title: element.title,
                description: element.description,
                coverImage: element.coverImage,
                backgroundColor: element.backgroundColor
            }
        });
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                categories,
                recentReads,
                mostPopular,
                curatedList,
                readsOfTheDayList: readsOfTheDay,
                latest: latestBooks,
                smallGroups: smallGroupsList
            }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getDashboard }
