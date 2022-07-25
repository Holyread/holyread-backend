import { BookSummaryModel, BookAuthorModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { randomNumberInRange } from '../../../lib/utils/utils'

const NODE_ENV = config.NODE_ENV

/** Get all book summaries with filter by author id or author name, book title or all */
const getAllBookSummariesForDiscover = async (skip: number, limit, search: any, sort, library?: any) => {
    try {
        let result: any = await BookSummaryModel.find({}).sort(sort).lean().exec()
        result = await Promise.all(result.map(async oneItem => {
            if (oneItem.author) {
                oneItem.author = await BookAuthorModel.findById(oneItem.author).lean()
                oneItem.author = {
                    _id: oneItem.author._id,
                    name: oneItem.author.name
                }
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
                totalStar: Number(randomNumberInRange(3, 4) + '.' + (randomNumberInRange(1, 9))),
                totalReads: randomNumberInRange(10000, 20000),
                bookMark: isSaved,
                coverImageBackground: oneItem.coverImageBackground,
                categories: oneItem.categories
            }
        }))
        result = result.filter(s => s)
        return { count: result.length, summaries: result.slice(skip, skip + limit) }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get user library book summaries */
const getAllBookSummaries = async (skip: number, limit, search: any, sort, library?: any) => {
    try {
        let result: any = await BookSummaryModel.find(search).skip(skip).limit(limit).sort(sort).lean().exec()
        let count: any = await BookSummaryModel.count(search).lean().exec()
        result = await Promise.all(result.map(async oneItem => {
            if (oneItem.author) {
                oneItem.author = await BookAuthorModel.findById(oneItem.author).lean()
                oneItem.author = {
                    _id: oneItem.author._id,
                    name: oneItem.author.name
                }
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
                totalStar: Number(randomNumberInRange(3, 4) + '.' + (randomNumberInRange(1, 9))),
                totalReads: randomNumberInRange(10000, 20000),
                bookMark: isSaved,
                coverImageBackground: oneItem.coverImageBackground,
                chapters: library ? oneItem.chapters : undefined,
                reads: Number((libBookChapters && libBookChapters?.length ? (100 * libBookChapters?.length) / oneItem?.chapters?.length : 0).toFixed(0)),
                categories: oneItem.categories
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
        const libBookChapters = global?.currentUser?.library?.reading?.find(item => String(item.bookId) === String(data._id))?.chaptersCompleted
        if (data.author) {
            data.author = await BookAuthorModel.findOne({ _id: data.author }).lean().exec()
        }
        data.totalStar = Number(randomNumberInRange(3, 4) + '.' + (randomNumberInRange(1, 9)))
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

export default {
    getAllBookSummaries,
    getAllBookSummariesForDiscover,
    getOneBookSummaryByFilter,
    findBook
}

/*
fix search 
get one book with book author name instead of book author id

*/
