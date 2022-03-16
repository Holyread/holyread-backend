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
            return {
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                author: oneItem.author,
                overview: oneItem.overview,
                totalStar: 100,
                totalReads: 100,
                bookMark: true,
                coverImageBackground: oneItem.coverImageBackground,
                chapters: library ? oneItem.chapters : null
            }
        }))
        return { count, summaries: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book summaries count for web */
const getAllBookSummariesCount = async () => {
    try {
        let result: any = await BookSummaryModel.find().count().lean()
        return result
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
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookSummaries,
    getAllBookSummariesCount,
    getOneBookSummaryByFilter
}

/*
fix search 
get one book with book author name instead of book author id

*/
