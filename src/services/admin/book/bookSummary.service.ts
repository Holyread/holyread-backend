import { BookSummaryModel, BookAuthorModel, HighLightsModel, BookCategoryModel, UserModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { responseMessage } from '../../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Add book summary */
const createBookSummary = async (body: any) => {
    try {
        const result = await BookSummaryModel.create(body)
        if (!result) {
            throw new Error(bookSummaryControllerResponse.createBookSummaryFailure)
        }
        if (result.coverImage) {
            result.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + result.coverImage
        }
        if (result.bookReadFile) {
            result.bookReadFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/reads/' + result.bookReadFile
        }
        if (result.videoFile) {
            result.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + result.videoFile
        }
        if (result.chapters && result.chapters.length) {
            result.chapters.forEach(async (oneChapter: any) => {
                if (oneChapter.audioFile) {
                    oneChapter.audioFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/audio/' + oneChapter.audioFile
                }
            });
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify book summary */
const updateBookSummary = async (body: any, id: string) => {
    try {
        const data: any = await BookSummaryModel.updateOne(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data) {
            if (data.coverImage) {
                data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + data.coverImage
            }
            if (data.bookReadFile) {
                data.bookReadFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/reads/' + data.bookReadFile
            }
            if (data.videoFile) {
                data.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + data.videoFile
            }
            if (data.chapters && data.chapters.length) {
                data.chapters.forEach(async oneChapter => {
                    if (oneChapter.audioFile) {
                        oneChapter.audioFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/audio/' + oneChapter.audioFile
                    }
                });
            }
        }
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get book summary by summary id */
const getOneBookSummaryByFilter = async (query: any) => {
    try {
        const data: any = await BookSummaryModel.findOne(query).lean()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book summaries count for dashboard */
const getBooksCountForDashboard = async () => {
    try {
        const result = await BookSummaryModel.aggregate([{ '$group': { '_id': '_id', 'chapters': { '$sum': { '$size': '$chapters' } } } }])
        const count: number = await BookSummaryModel.count().lean().exec()
        return { count, summaries: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book summaries count for dashboard */
const getTopReadsBooks = async (duration: 'year' | 'month' | 'week') => {
    try {
        const query = {};
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        switch(duration) {
            case 'week':
                query['_id.updatedAt'] = { $gte: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) }
                break;

            case 'month':
                query['_id.updatedAt'] = { $gte: new Date(now.setMonth(new Date().getMonth() - 1)) }
                break;
            
            default:
                query['_id.updatedAt'] = { $gte: new Date(now.setMonth(new Date().getMonth() - 12)) }
                break;
        }
        let result = await UserModel.aggregate(
            [
                {
                    '$match' : {
                        'library.reading.bookId' : {
                            '$exists' : true
                        }
                    }
                }, 
                {
                    '$project' : {
                        'email' : 1.0,
                        'library' : 1.0
                    }
                },
                {
                    '$unwind' : {
                        'path' : '$library.reading'
                    }
                }, 
                {
                    '$group' : {
                        '_id' : {
                            'book' : '$library.reading.bookId',
                            'email' : '$email',
                            updatedAt: '$library.reading.updatedAt',
                            'chapters' : {
                                '$sum' : {
                                    '$size' : '$library.reading.chaptersCompleted'
                                }
                            }
                        },
                        myCount: { $sum: 1 }
                    }
                }, 
                {
                    '$match' : query
                },
                {
                    '$group' : {
                        '_id' : '$_id.book',
                        'emails' : {
                            '$push' : {
                                'email' : '$_id.email',
                                'chapters' : '$_id.chapters'
                            }
                        },
                    }
                },
                {
                    '$group' : {
                        '_id' : '$_id',
                        'total' : {
                            '$sum' : {
                                '$size' : '$emails'
                            }
                        }
                    }
                }, 
                {
                    '$sort' : {
                        'total' : -1.0
                    }
                },
                {
                    '$limit': 5
                }
            ]
        )
        const totalReaders = await UserModel.count({ 'library.reading.bookId': { $exists: true } })

        result = await Promise.all(result.map(async i => {
            return {
                book: await BookSummaryModel.findOne({ _id: i._id }).select('title').lean().exec(),
                total: Math.trunc((i.total / totalReaders) * 100) + '%'
            }
        }))
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book summaries for table */
const getAllBookSummaries = async (skip: number, limit, search: object, sort) => {
    try {
        let authorsList: any;
        let categories: any;
        if (search['$or']) {
            authorsList = await BookAuthorModel.find({ 'name': search['$or'][0].title }).select('_id').lean().exec();
            categories = await BookCategoryModel.find({ 'title': search['$or'][0].title }).select('_id').lean().exec();
        }
        if (authorsList && authorsList.length) {
            const authorIds = authorsList.map(oneAuthor => oneAuthor._id)
            search['$or'].push({ 'author': { '$in': authorIds } })
        }
        if (categories && categories.length) {
            const categoriesIds = categories.map(oneCategory => oneCategory._id)
            search['$or'].push({ 'categories': { '$in': categoriesIds } })
        }
        const result: any = await BookSummaryModel.find(search).populate('author', 'name').populate('categories', 'title').skip(skip).limit(limit).sort(sort).lean().exec()
        const count: number = await BookSummaryModel.find(search).count().lean().exec()
        return { count, summaries: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book categories names */
const getAllBookSummariesOptionsList = async (query) => {
    try {
        const result = await BookSummaryModel.find(query).select('title coverImage').lean().exec()
        if (result && result.length) {
            result.forEach(element => {
                if (element && element.coverImage) {
                    element.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + element.coverImage
                }
            })
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove book summary */
const deleteBookSummary = async (id: string) => {
    try {
        await HighLightsModel.deleteMany({ bookId: id })
        await BookSummaryModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createBookSummary,
    updateBookSummary,
    getAllBookSummaries,
    getAllBookSummariesOptionsList,
    getOneBookSummaryByFilter,
    deleteBookSummary,
    getBooksCountForDashboard,
    getTopReadsBooks
}
