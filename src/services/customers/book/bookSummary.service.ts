import { BookSummaryModel, BookAuthorModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all book summaries */
const getAllBookSummaries = async (skip: number, limit, search: object, sort) => {
    try {
        let result: any = await BookSummaryModel.find().sort([['createdAt', 'DESC']]).lean()
        result = await Promise.all(result.map(async oneItem => {
            if (oneItem.author) {
                oneItem.author = await BookAuthorModel.findById(oneItem.author).lean()
                oneItem.author = {
                    _id: oneItem.author._id,
                    name: oneItem.author.name,
                    about: oneItem.author.about,
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
                coverImageBackground: oneItem.coverImageBackground
            }
        }))
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookSummaries
}
