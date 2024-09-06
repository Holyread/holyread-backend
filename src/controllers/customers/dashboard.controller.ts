import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose';
import Boom from '@hapi/boom';

import bookSummaryService from '../../services/customers/book/bookSummary.service'
import bookCategoryService from '../../services/customers/book/bookCategory.service'
import expertCuratedService from '../../services/customers/book/expertCurated.service'
import dailyDevotionalService from '../../services/customers/dailyDevotional/dailyDevotional.service'
import ratingService from '../../services/customers/book/rating.service'
import autherService from '../../services/customers/book/author.service'
import smallGroupService from '../../services/customers/smallGroup/smallGroup.service'
import { responseMessage } from '../../constants/message.constant'
import { awsBucket, dataLimit } from '../../constants/app.constant'
import { sortArrayObject, calculateDateInThePast } from '../../lib/utils/utils'
import config from '../../../config'
import userService from '../../services/customers/users/user.service';
import recommendedBookService from '../../services/customers/book/recommendedBook.service';

const NODE_ENV = config.NODE_ENV
const dashboardControllerResponse = responseMessage.dashboardControllerResponse
const smallGroupControllerResponse = responseMessage.smallGroupControllerResponse

/** Get categories for dashboard */
const getCategories = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const data: any = await bookCategoryService.getAllBookCategories(0, 0, { status: 'Active' }, { 'title': 1.0 })
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get recent reads books for Dashboard */
const getRecentReads = async (request: any, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const userObj = request.user
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        let recentReads: any;
        userObj.libraries = await userService.getUserLibrary({ _id: userObj.libraries }, ['reading'])
        if (!userObj?.libraries?.reading?.length) {
            recentReads = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), {}, { 'createdAt': -1.0 })
            return response.status(200).json({
                message: dashboardControllerResponse.getDashboardSuccess,
                data: {
                    recentReads,
                },
            })
        }

        /** collect user reads books ids those not in completed books list */
        const bookIds = new Set();
        userObj.libraries.reading.map(oneBook => {
            if (
                oneBook.bookId &&
                !userObj.libraries?.completed?.find(cb => String(cb) === String(oneBook.bookId))
            ) bookIds.add(new Types.ObjectId(oneBook.bookId))
        });

        /** Prepare query to get users reads book details */
        const search: any = { _id: { $in: [...bookIds] } }
        if (params.author) { search.author = params.author }
        /** Get user reads books details by users reads books ids */
        const data = await bookSummaryService.getAllBookSummaries(0, 0, search, { 'createdAt': -1.0 }, true)

        /** sort summary by latest reads based on user libraries readings */
        const set = new Set()
        userObj.libraries.reading.map(r => {
            const summary = data.summaries.find((os: any) => String(os._id) === String(r.bookId))
            if (!summary) return;
            summary.reads = Number(
                (
                    r.chaptersCompleted && r.chaptersCompleted?.length
                        ? (100 * r.chaptersCompleted?.length) / summary?.chapters?.length
                        : 0
                ).toFixed(0)
            ); summary.updatedAt = r.updatedAt
            summary.createdAt = r.createdAt
            delete summary.chapters
            set.add(summary);
        })

        data.summaries = [...set];

        if (params.sort) data.summaries = sortArrayObject(data.summaries, 'title', params.sort.toLowerCase())
        else data.summaries = sortArrayObject(data.summaries, 'createdAt', 'desc')

        data.summaries = data.summaries.slice(skip, skip + limit)
        return response.status(200).send({ message: dashboardControllerResponse.getDashboardSuccess, data: { recentReads: data } })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Get popular books for Dashboard */
const getPopularBooks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataLimit.skip
        const limit: any = params.limit ? params.limit : dataLimit.limit
        const mostPopular = await bookSummaryService.getMostPopularBooks(Number(skip), Number(limit), {}, { 'views': -1.0 })
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: { mostPopular },
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
        const data: any = await expertCuratedService.getAllExpertCurateds(Number(skip), Number(limit), { status: 'Active' }, { createdAt: -1.0 })
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get daily devotional for Dashboard */
const getDailyDevotional = async (request: Request | any, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query;
        const skip: number = Number(params.skip) || 0;
        const limit: number = Number(params.limit);
        const userObj: any = { ...request.user };
        const query: any = { _id: userObj.libraries };
        let data: any;

        // Initialize date range
        let start = new Date();
        let end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        let filter: any = {};

        // Determine date filter
        if (params.timeFrame === 'latest') {
            filter = { publishedAt: { $gte: start, $lte: end }, publish: true };
        } else if (params.timeFrame === 'yesterday') {
            const yesterday = calculateDateInThePast(1);
            yesterday.setHours(0, 0, 0, 0);
            const nextDay = new Date(yesterday);
            nextDay.setDate(yesterday.getDate() + 1);
            nextDay.setHours(0, 0, 0, 0);
            filter = { publishedAt: { $gte: yesterday, $lt: nextDay }, publish: true };
        } else if (params.timeFrame === 'all') {
            filter = { publish: true };
        }

        // Retrieve user libraries
        userObj.libraries = await userService.getUserLibrary(query);

        if (!userObj?.libraries?.devotionalCategories?.length && params.timeFrame !== 'all') {
            // If no specific categories, get all devotionals without category filter
            filter.category = { $exists: false };
            data = await dailyDevotionalService.getAllDailyDevotional(skip, limit, filter, [['publishedAt', 'desc']]);
        } else if (params.timeFrame === 'all') {
            data = await dailyDevotionalService.getAllDailyDevotional(skip, limit, filter, [['publishedAt', 'desc']]);
        } else {
            // Get devotionals from general and user-specific categories
            const categories = userObj.libraries.devotionalCategories;
            filter.category = { $exists: false };
            const generalDevotionalData: any = await dailyDevotionalService.getAllDailyDevotional(skip, limit, filter, [['publishedAt', 'desc']]) || [];

            filter.category = { $in: categories };
            const categoryDevotionalData: any = await dailyDevotionalService.getAllDailyDevotional(skip, limit, filter, [['publishedAt', 'desc']]) || [];

            // Combine and sort data
            const combinedData = [...generalDevotionalData.dailyDevotionalList, ...categoryDevotionalData.dailyDevotionalList];
            combinedData.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

            // Apply skip and limit
            if (limit) {
                data = combinedData.slice(skip, skip + limit);
            } else {
                data = combinedData.slice(skip);
            }

            data = { count: generalDevotionalData.count + categoryDevotionalData.count, dailyDevotionalList: data };
        }

        // Send response
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data,
        });
    } catch (e: any) {
        next(Boom.badData(e.message));
    }
};

/** Get recommended books for dashboard */
const getRecommendedBooks = async (request: any, response: Response, next: NextFunction) => {
    try {
        const libraries = await userService.getUserLibrary({ _id: request.user.libraries })

        const bookIds = libraries.reading.map(item => item.bookId);
        const readingBook = await bookSummaryService.findBooks({ _id: { $in: bookIds } });

        const categoryIds = libraries.categories || [];
        let categoriesBooks = [];
        if (categoryIds.length > 0) {
            categoriesBooks = await bookSummaryService.findRandomBooks({ $match: { categories: { $in: categoryIds }, publish: true } }, 5);
        }

        const books = [...readingBook, ...categoriesBooks];
        const preferredCategories = [];
        books.forEach(book => {
            book.categories.forEach(categoryId => {
                if (!preferredCategories.some(id => id.toString() === categoryId.toString())) {
                    preferredCategories.push(categoryId);
                }
            });
        });

        let recommendedBooks = [];
        let totalSuggestions = 0;
        // Define a weight factor to prioritize categories with more books read
        const weightFactor = 1; // You can adjust this factor as needed
        const MAX_SUGGESTIONS = 10;

        for (const category of preferredCategories) {
            // Calculate the number of books to select from this category based on its weight
            const categoryWeight = books.reduce((count, book) => {
                if (Array.isArray(book.categories)) {
                    book.categories.forEach(categoryId => {
                        if (categoryId.toString() === category.toString()) {
                            count++;
                        }
                    });
                }
                return count;
            }, 0);

            const numBooksToSelect = Math.ceil(MAX_SUGGESTIONS * (categoryWeight / books.length) * weightFactor);
            const categoryFilterquery = { $match: { categories: category, publish: true, _id: { $nin: bookIds } } }
            const selectedBooks = await bookSummaryService.findRandomBooks(categoryFilterquery, numBooksToSelect)

            selectedBooks.forEach(book => {
                recommendedBooks.push(book._id);
            });

            totalSuggestions += numBooksToSelect;

            if (totalSuggestions >= MAX_SUGGESTIONS) {
                break; // We have enough suggestions
            }
        }

        /* Select books from recommendedBooks if user not read any books */
        if (!recommendedBooks.length) {
            const result = await recommendedBookService.getAllRecommendedBooks(Number(0), Number(10), {}, [])
            recommendedBooks = result.recommendedBooks.map(item => item.book._id);
        }

        const ratings = await ratingService.getBooksRatings(recommendedBooks.filter(i => i) as [string], request.user._id)

        recommendedBooks = await Promise.all(recommendedBooks.map(async item => {

            const bookDetails: any = await bookSummaryService.findBook({ _id: item })
            const bookMark = libraries?.saved?.find(b => String(b) === String(bookDetails._id)) ? true : false
            const libBookChapters = libraries?.reading?.find(item => String(item.bookId) === String(bookDetails._id))?.chaptersCompleted

            item = {
                _id: bookDetails._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + bookDetails.coverImage,
                coverImageBackground: bookDetails.coverImageBackground,
                title: bookDetails.title,
                author: bookDetails.author,
                overview: bookDetails.overview,
                description: bookDetails.description,
                views: bookDetails.views || 0,
                bookFor: bookDetails.bookFor,
                bookMark,
                totalStar: bookDetails.totalStar || 3,
                isRate: !!ratings[String(bookDetails._id)]?.isRate,
                reads: Number((libBookChapters && libBookChapters?.length ? (100 * libBookChapters?.length) / bookDetails.chapters?.length : 0).toFixed(0)),
            }

            if (bookDetails.author) {
                const author = await autherService.findAuthor({ _id: bookDetails.author })
                item.author = {
                    _id: author._id,
                    name: author.name,
                    about: author.about,
                }
            }

            return item
        }))

        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                recommendedBooks,
                count: recommendedBooks.length,
            },
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get favorite categories books for dashboard */
const getFavoriteCategoriesBooks = async (request: any, response: Response, next: NextFunction) => {
    try {
        const libraries = await userService.getUserLibrary({ _id: request.user.libraries })

        const categoryIds = libraries.categories || [];
        const books = await bookSummaryService.findRandomBooks({ $match: { categories: { $in: categoryIds }, publish: true } }, 5);
        const preferredCategories = [];
        books.forEach(book => {
            book.categories.forEach(categoryId => {
                if (!preferredCategories.some(id => id.toString() === categoryId.toString())) {
                    preferredCategories.push(categoryId);
                }
            });
        });

        let favoriteCategoriesBooks = [];
        let totalSuggestions = 0;
        // Define a weight factor to prioritize categories with more books read
        const weightFactor = 1; // You can adjust this factor as needed
        const MAX_SUGGESTIONS = 10;

        for (const category of preferredCategories) {
            // Calculate the number of books to select from this category based on its weight
            const categoryWeight = books.reduce((count, book) => {
                if (Array.isArray(book.categories)) {
                    book.categories.forEach(categoryId => {
                        if (categoryId.toString() === category.toString()) {
                            count++;
                        }
                    });
                }
                return count;
            }, 0);

            const numBooksToSelect = Math.ceil(MAX_SUGGESTIONS * (categoryWeight / books.length) * weightFactor);
            const categoryFilterquery = { $match: { categories: category, publish: true } }
            const selectedBooks = await bookSummaryService.findRandomBooks(categoryFilterquery, numBooksToSelect)

            selectedBooks.forEach(book => {
                favoriteCategoriesBooks.push(book._id);
            });

            totalSuggestions += numBooksToSelect;

            if (totalSuggestions >= MAX_SUGGESTIONS) {
                break; // We have enough suggestions
            }
        }

        const ratings = await ratingService.getBooksRatings(favoriteCategoriesBooks.filter(i => i) as [string], request.user._id)

        favoriteCategoriesBooks = await Promise.all(favoriteCategoriesBooks.map(async item => {

            const bookDetails: any = await bookSummaryService.findBook({ _id: item })
            const bookMark = libraries?.saved?.find(b => String(b) === String(bookDetails._id)) ? true : false
            const libBookChapters = libraries?.reading?.find(item => String(item.bookId) === String(bookDetails._id))?.chaptersCompleted

            item = {
                _id: bookDetails._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + bookDetails.coverImage,
                coverImageBackground: bookDetails.coverImageBackground,
                title: bookDetails.title,
                author: bookDetails.author,
                overview: bookDetails.overview,
                description: bookDetails.description,
                views: bookDetails.views || 0,
                bookFor: bookDetails.bookFor,
                bookMark,
                totalStar: bookDetails.totalStar || 3,
                isRate: !!ratings[String(bookDetails._id)]?.isRate,
                reads: Number((libBookChapters && libBookChapters?.length ? (100 * libBookChapters?.length) / bookDetails.chapters?.length : 0).toFixed(0)),
            }

            if (bookDetails.author) {
                const author = await autherService.findAuthor({ _id: bookDetails.author })
                item.author = {
                    _id: author._id,
                    name: author.name,
                    about: author.about,
                }
            }

            return item
        }))

        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: {
                favoriteCategoriesBooks,
                count: favoriteCategoriesBooks.length,
            },
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
            const data = await smallGroupService.getOneSmallGroupByFilter({ _id: params.id, status: 'Active', publish: true })
            response.status(200).json({
                message: smallGroupControllerResponse.fetchSmallGroupSuccess,
                data,
            })
            return;
        }
        const data: any = await smallGroupService.getAllSmallGroups(Number(skip), Number(limit), { status: 'Active', publish: true }, { createdAt: -1.0 })

        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data,
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
        const data: any = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), {}, { 'createdAt': -1.0 })
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data,
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
    getDailyDevotional,
    getRecentReads,
    getRecommendedBooks,
    getSmallGroups,
    getFavoriteCategoriesBooks
}
