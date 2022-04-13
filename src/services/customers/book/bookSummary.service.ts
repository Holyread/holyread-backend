import { BookSummaryModel, BookAuthorModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all book summaries */
const getAllBookSummaries = async (skip: number, limit, search: object, sort, library?: any) => {
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
            const libBookChapters = global?.currentUser?.library.reading.find(item => String(item.bookId) === String(oneItem._id))?.chaptersCompleted
            return {
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                author: oneItem.author,
                overview: oneItem.overview,
                totalStar: 100,
                totalReads: 100,
                bookMark: isSaved,
                coverImageBackground: oneItem.coverImageBackground,
                chapters: library ? oneItem.chapters : undefined,
                reads: Number((libBookChapters && libBookChapters?.length ? (100 * libBookChapters?.length) / oneItem?.chapters?.length : 0).toFixed(0))
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
        const data: any = await BookSummaryModel.findOne(query).lean()
        if (data.author) {
            data.author = await BookAuthorModel.findById(data.author).select('_id name about').lean().exec()
        }
        const isSaved = global?.currentUser?.library?.saved?.find(b => String(b) === String(data?._id)) ? true : false
        data.totalStar = 100
        data.totalReads = 100
        data.bookMark = isSaved
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookSummaries,
    getOneBookSummaryByFilter
}

/*
fix search 
get one book with book author name instead of book author id

*/
