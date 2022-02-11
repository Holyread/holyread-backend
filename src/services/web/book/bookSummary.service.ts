import { BookSummaryModel } from '../../../models/index'
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

/** Get all book summaries for table */
const getAllBookSummaries = async (skip: number, limit, search: object, sort) => {
    try {
        const result: any = await BookSummaryModel.find(search).populate('author', 'name').populate('categories', 'title').skip(skip).limit(limit).sort(sort).lean()
        const count: number = await BookSummaryModel.find(search).count()
        return { count, summaries: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all book categories names */
const getAllBookSummariesOptionsList = async (query) => {
    try {
        const result = await BookSummaryModel.find(query).select('title coverImage').lean()
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
    deleteBookSummary
}
