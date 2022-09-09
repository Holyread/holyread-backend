import { SmallGroupModel, BookSummaryModel, BookAuthorModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { randomNumberInRange } from '../../../lib/utils/utils'
import ratingService from '../book/rating.service'

const NODE_ENV = config.NODE_ENV

/** Get all small group for app */
const getAllSmallGroups = async (skip: number, limit, search: object, sort) => {
    try {
        let smallgroupsList: any = await SmallGroupModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        let count: any = await SmallGroupModel.count(search).lean().exec()
        smallgroupsList = await Promise.all(await smallgroupsList.map(async (item) => {
            if (item && item.books && item.books.length) {
                item.books = await Promise.all(item.books.map(async oneBook => {
                    const bookDetails = await BookSummaryModel.findById(oneBook).select('coverImage description').lean().exec()
                    if (!bookDetails) {
                        return oneBook
                    }
                    bookDetails.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + bookDetails.coverImage
                    return bookDetails
                }))
            } else {
                --count
            }
            return {
                _id: item._id,
                iceBreaker: item.iceBreaker,
                introduction: item.introduction,
                title: item.title,
                description: item.description,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.smallGroupDirectory + '/' + item.coverImage,
                backgroundColor: item.backgroundColor,
                books: item.books,
                bookMark: global?.currentUser?.smallGroups?.find(os => String(os) === String(item._id)) ? true : false
            }
        }))
        return { smallgroupsList, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get one small group by filter */
const getOneSmallGroupByFilter = async (query: any) => {
    try {
        const result: any = await SmallGroupModel.findOne(query).populate('books', 'title overview description author coverImage coverImageBackground views').lean()
        result.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.smallGroupDirectory + '/' + result.coverImage
        if (result?.books.length) {
            result.books = await Promise.all(result?.books?.map(async oneBook => {
                if (!oneBook?._id) return undefined
                if (oneBook.author) {
                    const authorDetails = await BookAuthorModel.findOne({ _id: oneBook.author }).select('name _id').lean().exec()
                    oneBook.author = authorDetails ? authorDetails : oneBook.author
                }
                oneBook.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneBook.coverImage
                oneBook.views = oneBook.views || randomNumberInRange(10000, 20000)
                return oneBook
            }).filter(ob => ob))
            const ratings = await ratingService.getBooksRatings(result.books.map(i => i && i._id).filter(i => i) as [string], global.currentUser._id)
            result.books.map(i => {
                i.totalStar = ratings[String(i._id)]?.averageStar || 3,
                i.isRate = !!ratings[String(i._id)]?.isRate
            })
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllSmallGroups,
    getOneSmallGroupByFilter
}
