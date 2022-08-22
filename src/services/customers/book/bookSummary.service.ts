import { BookSummaryModel, BookAuthorModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { randomNumberInRange } from '../../../lib/utils/utils'
import usersService from '../users/user.service'
import ratingService from './rating.service'

const NODE_ENV = config.NODE_ENV

/** Get all book summaries with filter by author id or author name, book title or all */
const getAllBookSummariesForDiscover = async (skip: number, limit, search: any, sort) => {
    try {
        let result: any = await BookSummaryModel.find({}).select('-chapters').lean()
        const authors = await BookAuthorModel.find({}).select('name').lean()
        result = await Promise.all(result.map(async oneItem => {
            if (oneItem.author) {
                oneItem.author = authors.find(oneAuthor => String(oneAuthor._id) === String(oneItem.author))
            }
            /** if search category books then return if category books not exist */
            if (search?.categories && !oneItem.categories.find(oneCate => String(oneCate) === String(search.categories))) return null
            /** if search author then return if book author not match */
            if (search?.author && String(oneItem.author._id) !== String(search?.author)) return null
            /** if search then return if book title or author name not match */
            if (search.filter && !oneItem?.title?.toLowerCase()?.includes(search.filter) && !oneItem?.author?.name?.toLowerCase().includes(search.filter.trim().toLowerCase())) return null

            const isSaved = global?.currentUser?.library?.saved?.find(b => String(b) === String(oneItem?._id)) ? true : false
            return {
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                description: oneItem.description,
                author: oneItem.author,
                overview: oneItem.overview,
                totalReads: randomNumberInRange(10000, 20000),
                bookMark: isSaved,
                coverImageBackground: oneItem.coverImageBackground,
                categories: oneItem.categories
            }
        }))
        result = result.filter(s => s).slice(skip, skip + limit)
        const ratings = await ratingService.getBooksRatings(result.map(i => i && i._id).filter(i => i) as [string], global.currentUser._id)
        result.map(i => {
            i.totalStar = ratings[String(i._id)]?.averageStar || 3,
            i.isRate = !!ratings[String(i._id)]?.isRate
        })
        return { count: result.length, summaries: result.slice(skip, skip + limit) }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get user library book summaries */
const getAllBookSummaries = async (skip: number, limit: number, search: any, sort, library?: any) => {
    try {
        let result: any = await BookSummaryModel.find(search).select('title author overview description coverImage coverImageBackground categories chapters.name chapters.size').skip(skip).limit(limit).sort(sort).lean().exec()
        let count: any = await BookSummaryModel.count(search).lean().exec()
        const ratings = await ratingService.getBooksRatings(result.map(i => i && i._id).filter(i => i) as [string], global.currentUser._id)
        const authors = await BookAuthorModel.find({}).select('name').lean().exec()
        result = await Promise.all(result.map(async oneItem => {
            if (oneItem.author) {
                oneItem.author = authors.find(i => String(i._id) === String(oneItem.author))
            }
            const isSaved = global?.currentUser?.library?.saved?.find(b => String(b) === String(oneItem?._id)) ? true : false
            const libBookChapters = global?.currentUser?.library?.reading?.find(item => String(item.bookId) === String(oneItem._id))?.chaptersCompleted
            return {
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                author: oneItem.author,
                overview: oneItem.overview,
                description: oneItem.description,
                totalReads: randomNumberInRange(10000, 20000),
                bookMark: isSaved,
                coverImageBackground: oneItem.coverImageBackground,
                chapters: library ? oneItem.chapters : undefined,
                reads: Number((libBookChapters && libBookChapters?.length ? (100 * libBookChapters?.length) / oneItem?.chapters?.length : 0).toFixed(0)),
                categories: oneItem.categories,
                totalStar: ratings[String(oneItem._id)]?.averageStar || 3,
                isRate: !!ratings[String(oneItem._id)]?.isRate
            }
        }))
        return { count, summaries: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get book summary by summary id */
const getOneBookSummaryByFilter = async (query: any) => {
    try {
        const data: any = await BookSummaryModel.findOne(query).lean().exec()
        if (!data) return data;
        const ratings = await ratingService.getBooksRatings([String(data._id)], global.currentUser._id)
        const libBookChapters = global?.currentUser?.library?.reading?.find(item => String(item.bookId) === String(data._id))?.chaptersCompleted
        if (data.author) {
            data.author = await BookAuthorModel.findOne({ _id: data.author }).lean().exec()
        }
        data.totalStar = ratings[String(data._id)]?.averageStar || 3,
        data.isRate = !!ratings[String(data._id)]?.isRate
        data.totalReads = randomNumberInRange(10000, 20000)
        data.bookMark = global?.currentUser?.library?.saved?.find(b => String(b) === String(data?._id)) ? true : false
        data.reads = Number((libBookChapters?.length ? (100 * libBookChapters?.length) / data?.chapters?.length : 0).toFixed(0))
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get book summary */
const findBook = async (query: any) => {
    try {
        const data: any = await BookSummaryModel.findOne(query).lean().exec()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

const getMostPopularBooks = async (skip: number, limit: number) => {
    try {
        const users = await usersService.getAllUsers({ 'library.reading.0': { '$exists': true } })
        let summaries = []
        let books = await BookSummaryModel.find({}).select('chapters._id _id description overview categories coverImage coverImageBackground title author').lean().exec()
        await Promise.all(users.map(async oneUser => {
            await Promise.all(oneUser.library.reading.map(async oneBook => {
                const bookDetails = books.find(i => String(i._id) === String(oneBook.bookId))
                if (bookDetails) {
                    const existingIndex = summaries.findIndex(i => String(i.book._id) === String(oneBook.bookId))
                    const reads = 0 && Number((oneBook.chaptersCompleted?.length ? (100 * oneBook.chaptersCompleted?.length) / bookDetails?.chapters?.length : 0).toFixed(0))
                    if (existingIndex >= 0) {
                        summaries[existingIndex].reads += reads || 1
                    } else {
                        summaries.push({ book: bookDetails, reads: 1, chaptersCompleted: oneBook?.chaptersCompleted })
                    }
                }
            }))
        }))
        const authors = summaries.length && await BookAuthorModel.find({}).select('name').lean()
        const count = summaries.length;
        summaries = summaries.sort((a, b) => { return b.reads - a.reads }).slice(skip, skip + limit);
        const ratings = await ratingService.getBooksRatings(summaries.map(i => i.book && i.book._id).filter(i => i) as [string], global.currentUser._id)
        
        summaries = await Promise.all(summaries.map(async oneItem => {
            const isSaved = global?.currentUser?.library?.saved?.find(b => String(b) === String(oneItem?.book?._id)) ? true : false
            if (oneItem.book.author) {
                oneItem.book.author = authors.find(oneAuthor => String(oneAuthor._id) === String(oneItem?.book?.author))
            }
            const libBookChapters = global?.currentUser?.library?.reading?.find(item => String(item.bookId) === String(oneItem.book._id))?.chaptersCompleted
            return {
                _id: oneItem.book._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.book.coverImage,
                title: oneItem.book.title,
                description: oneItem.book.description,
                author: oneItem.book.author,
                overview: oneItem.book.overview,
                totalStar: ratings[String(oneItem.book._id)]?.averageStar || 3,
                isRate: !!ratings[String(oneItem.book._id)]?.isRate,
                totalReads: randomNumberInRange(10000, 20000),
                bookMark: isSaved,
                coverImageBackground: oneItem.book.coverImageBackground,
                categories: oneItem.book.categories,
                reads: Number((libBookChapters?.length ? (100 * libBookChapters?.length) / oneItem.book?.chapters?.length : 0).toFixed(0)),
            }
        }))
        return { summaries, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookSummaries,
    getAllBookSummariesForDiscover,
    getOneBookSummaryByFilter,
    findBook,
    getMostPopularBooks
}

/*
fix search 
get one book with book author name instead of book author id

*/
