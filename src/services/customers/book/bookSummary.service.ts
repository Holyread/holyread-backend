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
        let result: any
            = await BookSummaryModel
                .aggregate([
                    {
                        "$project": {
                            "coverImage": 1.0,
                            "coverImageBackground": 1.0,
                            "title": 1.0,
                            "description": 1.0,
                            "author": 1.0,
                            "overview": 1.0,
                            "categories": 1.0
                        }
                    },
                    {
                        "$lookup": {
                            "from": "bookauthors",
                            "localField": "author",
                            "foreignField": "_id",
                            "as": "author"
                        }
                    },
                    {
                        "$match": search.search
                    },
                    {
                        $facet: {
                            page: [{ $skip: skip }, { $limit: limit }],
                            total: [
                                {
                                    $count: 'count'
                                }
                            ]
                        }
                    }
                ]);

        delete search.star;
                
        const star = search.star;
        const count = result[0].total[0].count
        const ratings = await ratingService.getBooksRatings(result[0]?.page?.map(i => i && i._id).filter(i => i) as [string], global.currentUser._id)
        const summaries = new Set()
        const saved = global?.currentUser?.library?.saved

        await Promise.all(result[0]?.page?.map(async oneItem => {
            const totalStar = ratings[String(oneItem._id)]?.averageStar || 3
            if (star && star !== Math.trunc(totalStar)) return

            summaries.add({
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                description: oneItem.description,
                author: oneItem.author[0] || {},
                overview: oneItem.overview,
                views: oneItem.views || randomNumberInRange(10000, 20000),
                bookMark: !!saved?.find(b => String(b) === String(oneItem?._id)),
                coverImageBackground: oneItem.coverImageBackground,
                categories: oneItem.categories,
                isRate: !!ratings[String(oneItem._id)]?.isRate,
                totalStar
            })
        }))

        return { count, summaries: [...summaries] }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get user library book summaries */
const getAllBookSummaries = async (skip: number, limit: number, search: any, sort, library?: any) => {
    try {
        const star = search.star
        delete search.star
        let result: any = await BookSummaryModel
            .find(search)
            .select([
                'title',
                'author',
                'overview',
                'description',
                'coverImage',
                'coverImageBackground',
                'categories',
                'views',
                'chapters.name',
                'chapters.size'
            ])
            .populate('author', 'name')
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .lean()
            .exec();
        let count: any = await BookSummaryModel.count(search).lean().exec()

        const ratings = await ratingService.getBooksRatings(result.map(i => i && i._id).filter(i => i) as [string], global.currentUser._id)
        result = await Promise.all(result.map(async oneItem => {
            const isSaved = global?.currentUser?.library?.saved?.find(b => String(b) === String(oneItem?._id)) ? true : false
            const libBookChapters = global?.currentUser?.library?.reading?.find(item => String(item.bookId) === String(oneItem._id))?.chaptersCompleted
            const totalStar = ratings[String(oneItem._id)]?.averageStar || 3
            if (star && star !== Math.trunc(totalStar)) {
                --count;
                return false
            }
            return {
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                author: oneItem.author,
                overview: oneItem.overview,
                description: oneItem.description,
                views: oneItem.views || randomNumberInRange(10000, 20000),
                bookMark: isSaved,
                coverImageBackground: oneItem.coverImageBackground,
                chapters: library ? oneItem.chapters : undefined,
                reads: Number((libBookChapters && libBookChapters?.length ? (100 * libBookChapters?.length) / oneItem?.chapters?.length : 0).toFixed(0)),
                categories: oneItem.categories,
                totalStar,
                isRate: !!ratings[String(oneItem._id)]?.isRate
            }
        }))
        return { count, summaries: result.filter(i => i) }
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
        data.views = data.views || randomNumberInRange(10000, 20000)
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
        let books = await BookSummaryModel.find({}).select('chapters._id _id description overview categories coverImage coverImageBackground title author views').lean().exec()
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
                views: oneItem.book.views || randomNumberInRange(10000, 20000),
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


/** Modify book summary */
const updateBookSummary = async (body: any, query: object) => {
    try {
        await BookSummaryModel.updateOne(query, body)
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookSummaries,
    getAllBookSummariesForDiscover,
    getOneBookSummaryByFilter,
    findBook,
    getMostPopularBooks,
    updateBookSummary
}

/*
fix search 
get one book with book author name instead of book author id

*/
