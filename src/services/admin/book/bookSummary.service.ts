import { BookSummaryModel, BookAuthorModel, HighLightsModel, BookCategoryModel, UserModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { responseMessage } from '../../../constants/message.constant'
import { formattedDate } from '../../../lib/utils/utils'

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
        const summaries = await BookSummaryModel.aggregate([
            { $unwind: "$chapters" },
            { $count: "chaptersCount" }
        ]);

        const chaptersCount = summaries.length ? summaries[0].chaptersCount : 0;
        const booksCount = await BookSummaryModel.countDocuments().exec();

        return { chaptersCount, booksCount };
    } catch (e: any) {
        throw new Error(e.message || 'Failed to get book summaries for dashboard');
    }
};

/** Get all book summaries count for dashboard */
const getTopReadsBooks = async (duration: 'year' | 'month' | 'week') => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let startDate: Date;

        switch (duration) {
            case 'week':
                startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default:
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
        }

        const result = await UserModel.aggregate([
            { $unwind: '$libraries' },
            {
                $lookup: {
                    from: 'userlibraries',
                    localField: 'libraries',
                    foreignField: '_id',
                    as: 'libraries',
                },
            },
            { $unwind: '$libraries' },
            { $unwind: '$libraries.reading' },
            { $match: { 'libraries.reading.updatedAt': { $gte: startDate } } },
            {
                $group: {
                    _id: '$libraries.reading.bookId',
                    readers: { $addToSet: '$email' },
                    chaptersCompleted: { $sum: { $size: '$libraries.reading.chaptersCompleted' } },
                },
            },
            {
                $lookup: {
                    from: 'booksummaries',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookDetails',
                },
            },
            { $unwind: '$bookDetails' },
            {
                $project: {
                    _id: 1,
                    title: '$bookDetails.title',
                    totalReaders: { $size: '$readers' },
                    chaptersCompleted: 1,
                },
            },
            { $sort: { totalReaders: -1 } },
            { $limit: 5 },
        ]);

        const totalReaders = result.reduce((sum, book) => sum + book.totalReaders, 0);

        const topReads = result.map(book => ({
            _id: book._id,
            title: book.title,
            total: Math.trunc((book.totalReaders / totalReaders) * 100) + '%',
        }));

        return topReads;
    } catch (e: any) {
        throw new Error(e.message || 'Failed to get top read books for dashboard');
    }
};

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
        const result: any = await BookSummaryModel.find(search)
            .populate('author', 'name')
            .populate('categories', 'title')
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .lean()
            .exec();

        await result.map(i => {
                i.publishedAt = formattedDate(i.publishedAt).replace(/ /g, ' ');
        });
        const count: number = await BookSummaryModel.find(search).countDocuments().lean().exec()
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
    getTopReadsBooks,
}
