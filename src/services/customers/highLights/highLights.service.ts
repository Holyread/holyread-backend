import { HighLightsModel, BookAuthorModel, BookSummaryModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

const highLightsControllerResponse = responseMessage.highLightsControllerResponse
/** Add high lights */
const createHighLight = async (body: any) => {
    try {
        const existingHighLight = await HighLightsModel.findOne(
            {
                userId: body.userId,
                chapterId: body.chapterId,
                bookId: body.bookId,
                'highLights.startIndex': body.startIndex,
                'highLights.endIndex': body.endIndex
            }
        ).lean().exec()
        if (existingHighLight) {
            throw new Error(highLightsControllerResponse.HighLightExistError)
        }
        if (body.startIndex > body.endIndex) {
            throw new Error(highLightsControllerResponse.invalidStartIndexError)
        }
        const highLights: any = {
            'note': body.note,
            'color': body.color,
            'startIndex': body.startIndex,
            'endIndex': body.endIndex
        }
        if (body.textDecoration) {
            highLights.textDecoration = body.textDecoration
        }
        const result = await HighLightsModel.findOneAndUpdate(
            {
                userId: body.userId,
                chapterId: body.chapterId,
                bookId: body.bookId
            },
            {
                '$push': { highLights },
            },
            { upsert: true, new: true }
        ).lean().exec()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify high light */
const updateHighLight = async (body: any, id: string) => {
    try {
        const newBody: any = {}
        if (body.color) {
            newBody['$set'] = { ...newBody['$set'], 'highLights.$.color': body.color }
        }
        if (body.note) {
            newBody['$set'] = { ...newBody['$set'], 'highLights.$.note': body.note }
        }
        if (body.textDecoration) {
            newBody['$set'] = { ...newBody['$set'], 'highLights.$.textDecoration': body.textDecoration }
        }
        if (body.color === null) {
            newBody['$unset'] = { ...newBody['$unset'], 'highLights.$.color': 1 }
        }
        if (body.textDecoration === null) {
            newBody['$unset'] = { ...newBody['$unset'], 'highLights.$.textDecoration': 1 }
        }
        const data: any = await HighLightsModel.findOneAndUpdate(
            { 'highLights._id': id, userId: body.userId },
            newBody
        ).lean().exec()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get high lights by category id */
const getHighLightsByFilter = async (skip: number, limit, search: object, sort) => {
    try {
        const result: any = await HighLightsModel.find(search).skip(skip).limit(limit).sort(sort).lean().exec()
        await Promise.all(await result.map(async (item: any) => {
            const bookDetails = await BookSummaryModel.findOne({ _id: item.bookId })
            if (!bookDetails) return
            item.chapter = bookDetails.chapters.find((oneChapter: any) => String(oneChapter._id) === String(item.chapterId))
            item.title = bookDetails.title
            item.overview = bookDetails.overview
            item.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + bookDetails.coverImage
            item.bookId = item.bookId._id
            if (bookDetails.author) {
                item.author = await BookAuthorModel.findOne({ _id: bookDetails.author }).lean().exec()
            }
        }))
        const count: any = await HighLightsModel.count(search).lean().exec()
        return { highLightsBooks: result, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove high light */
const deleteHighLight = async (userId: string, id: string, highLightId: string) => {
    try {
        await HighLightsModel.findOneAndUpdate(
            { '_id': id, userId },
            {
                '$pull': {
                    'highLights': { '_id': highLightId }
                }
            }
        )
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createHighLight,
    updateHighLight,
    getHighLightsByFilter,
    deleteHighLight
}
