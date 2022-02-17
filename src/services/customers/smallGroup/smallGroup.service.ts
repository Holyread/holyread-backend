import { SmallGroupModel, BookSummaryModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all small group for app */
const getAllSmallGroups = async (skip: number, limit, search: object, sort) => {
    try {
        let result: any = await SmallGroupModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        result = await Promise.all(await result.map(async (item) => {
            if (item && item.books && item.books.length) {
                item.books = await Promise.all(item.books.map(async oneBook => {
                    const bookDetails = await BookSummaryModel.findById(oneBook).select('coverImage').lean().exec()
                    if (!bookDetails) {
                        return oneBook
                    }
                    bookDetails.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + bookDetails.coverImage
                    return bookDetails
                }))
            }
            return {
                _id: item._id,
                iceBreaker: item.iceBreaker,
                introduction: item.introduction,
                title: item.title,
                description: item.description,
                backgroundColor: item.backgroundColor,
                books: item.books
            }
        }))
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllSmallGroups
}
