import { HighLightsModel, BookAuthorModel, BookSummaryModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
const NODE_ENV = config.NODE_ENV

const highLightsControllerResponse = responseMessage.highLightsControllerResponse
const validateColor = (color: string) => (/^#([0-9a-f]{3}){1,2}$/i).test(color)

/** Add high lights */
const createHighLight = async (body: any) => {
    try {
        const query = {
            userId: body.userId,
            chapterId: body.chapterId,
            bookId: body.bookId,
            'highLights.startIndex': body.startIndex,
            'highLights.endIndex': body.endIndex
        }
        if (body.color && !validateColor(body.color)) {
            throw new Error(highLightsControllerResponse.invalidHighLightColor)
        }
        const existingHighLight = await HighLightsModel.findOne(query).lean().exec()
        if (existingHighLight) {
            let newBody = {}
            if (body.color && !body.textDecoration) {
                newBody['$set'] = { ...newBody['$set'], 'highLights.$.color': body.color }
            }
            if (body.textDecoration && !body.color) {
                newBody['$set'] = { ...newBody['$set'], 'highLights.$.textDecoration': body.textDecoration }
            }
            const data: any = await HighLightsModel.findOneAndUpdate(query, newBody, { new: true }).lean().exec()
            return data
        }
        if (body.startIndex > body.endIndex) {
            throw new Error(highLightsControllerResponse.invalidStartIndexError)
        }
        const highLights: any = {
            'note': body.note,
            'color': body.color,
            'startIndex': body.startIndex,
            'endIndex': body.endIndex,
            'text': body.text
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
        if (body.color && !validateColor(body.color)) {
            throw new Error(highLightsControllerResponse.invalidHighLightColor)
        }
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
        const data: any = await HighLightsModel.updateOne(
            { 'highLights._id': id, userId: body.userId },
            newBody
        ).lean().exec()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get high light by filter */
const getHighLightByFilter = async (skip: number, limit, search: object, sort) => {
    try {
        const result: any = await HighLightsModel.find(search).skip(skip).limit(limit).sort(sort).lean().exec()
        const count: any = await HighLightsModel.count(search).lean().exec()
        return { highLightsBooks: result, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get high lights by category id */
const getHighLightsByFilter = async (skip: number, limit, filter: any, sort) => {
    try {
        const search = filter.search ? filter.search.trim().toLowerCase() : filter.search
        delete filter.search
        let result: any = await HighLightsModel.find(filter).sort(sort).lean().exec()
        let newResult = []
        await Promise.all(await result.map(async (item: any) => {
            const bookDetails = await BookSummaryModel.findOne({ _id: item.bookId }).lean().exec()
            if (!bookDetails) return
            const chapterDetails: any = bookDetails.chapters.find((oneChapter: any) => String(oneChapter._id) === String(item.chapterId))
            const authorDetails = await BookAuthorModel.findOne({ _id: bookDetails.author }).select('name').lean().exec()
            const existingHighLight = newResult.findIndex(o => String(o.bookId) === String(item.bookId))

            if (filter.bookId) {
                item.highLights.map(oneItem => {
                    delete chapterDetails.audioFile
                    oneItem.chapter = {
                        _id: chapterDetails._id,
                        name: chapterDetails.name
                    }
                })
            }

            if (existingHighLight === -1) {
                newResult.push({
                    _id: item._id,
                    bookId: item.bookId,
                    userId: item.userId,
                    title: bookDetails.title,
                    coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + bookDetails.coverImage,
                    coverImageBackground: bookDetails.coverImageBackground,
                    author: authorDetails,
                    overview: bookDetails.overview,
                    highLights: item.highLights,
                    count: item.highLights && item.highLights.length ? item.highLights.length : 0
                })
            } else {
                newResult[existingHighLight].highLights = newResult[existingHighLight].highLights.concat(item.highLights)
                newResult[existingHighLight].count = newResult[existingHighLight].count + item.highLights.length
            }
        }))

        /** filters results by search */
        result = newResult.filter(i => {
            if (!i || !i?.highLights?.length) return false
            i.highLights = i.highLights.sort((a,b) => (a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0))
            if (!search) {
                i.highLights = i.highLights.slice(skip, skip + limit)
                return true
            }
            else if (i.title.toLowerCase().includes(search)) {
                i.highLights = i.highLights.slice(skip, skip + limit)
                return true
            }
            else if (i.author && i.author.name.toLowerCase().includes(search)) {
                i.highLights = i.highLights.slice(skip, skip + limit)
                return true
            }
            else if (filter.bookId && i.highLights.find(o => o.chapter.name.toLowerCase().includes(search))) {
                i.highLights = i.highLights.slice(skip, skip + limit)
                return true
            }
            else if (filter.bookId) {
                i.highLights = i.highLights.filter(oneHl => {
                    return (
                        (
                            oneHl.startIndex &&
                            oneHl.endIndex &&
                            oneHl.startIndex < oneHl.endIndex &&
                            oneHl.text.toLowerCase().includes(search)
                        )
                        || i.highLights.find(o => o.chapter.name.toLowerCase().includes(search))
                    ) ? true : false
                })
                i.count = i.highLights.length
                i.highLights = i.highLights.slice(skip, skip + limit)
                return i.highLights.length ? true : false
            }
            return false
        })
        const count: any = result.length;
        return { highLightsBooks: limit && !filter.bookId ? result.slice(skip, (skip + limit)) : result, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove high light */
const deleteHighLight = async (userId: string, id: string, highLightId: string) => {
    try {
        await HighLightsModel.findOneAndUpdate(
            { '_id': id, userId: userId },
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
    getHighLightByFilter,
    getHighLightsByFilter,
    deleteHighLight
}
