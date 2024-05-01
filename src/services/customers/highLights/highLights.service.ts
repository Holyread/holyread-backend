import { HighLightsModel } from '../../../models/index'
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
        }
        if (body.startIndex !== body.endIndex) {
            body['highLights.endIndex'] = body.endIndex
        }
        if (body.color && !validateColor(body.color)) {
            throw new Error(highLightsControllerResponse.invalidHighLightColor)
        }
        const existingHighLight = await HighLightsModel.findOne(query).lean().exec()
        const now = new Date()
        if (existingHighLight) {
            const newBody: any = {
                '$set': {
                    'highLights.$.startIndex': body.startIndex,
                    'highLights.$.endIndex': body.endIndex,
                    'highLights.$.text': body.text,
                },
            }
            if (body.note) {
                newBody.note = body.note
            }
            if (body.color && !body.textDecoration) {
                newBody.$set = { ...newBody.$set, 'highLights.$.color': body.color, 'highLights.$.updatedAt': now }
                newBody.updatedAt = now
            }
            if (body.textDecoration && !body.color) {
                newBody.$set = { ...newBody.$set, 'highLights.$.textDecoration': body.textDecoration, 'highLights.$.updatedAt': now }
                newBody.updatedAt = now
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
            'text': body.text,
            updatedAt: now,
        }
        if (body.textDecoration) {
            highLights.textDecoration = body.textDecoration
        }
        const result = await HighLightsModel.findOneAndUpdate(
            {
                userId: body.userId,
                chapterId: body.chapterId,
                bookId: body.bookId,
            },
            {
                '$push': { highLights },
                $setOnInsert: { createdAt: now },
                updatedAt: now,
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
        const now = new Date()
        if (body.color) {
            newBody.$set = { ...newBody.$set, 'highLights.$.color': body.color }
        }
        if (body.note || body.note === '') {
            newBody.$set = { ...newBody.$set, 'highLights.$.note': body.note }
        }
        if (body.textDecoration) {
            newBody.$set = { ...newBody.$set, 'highLights.$.textDecoration': body.textDecoration }
        }
        if (body.color === null) {
            newBody.$unset = { ...newBody.$unset, 'highLights.$.color': 1 }
        }
        if (body.textDecoration === null) {
            newBody.$unset = { ...newBody.$unset, 'highLights.$.textDecoration': 1 }
        }
        if (Object.keys(newBody).length) {
            newBody.$set = { ...newBody.$set, 'highLights.$.updatedAt': now }
        }
        const data: any = await HighLightsModel.updateOne(
            { 'highLights._id': id, userId: body.userId },
            { ...newBody, updatedAt: now }
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
        const count: any = await HighLightsModel.countDocuments(search).lean().exec()
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

        let result = await HighLightsModel.aggregate([
            {
                $match: {
                    ...filter,
                },
            },
            {
                $project: {
                    bookId: -1,
                    chapterId: 1,
                    userId: -1,
                    createdAt: -1,
                    highLights: 1,
                    updatedAt : 1,
                },
            },
            {
                '$lookup': {
                    'from': 'booksummaries',
                    'localField': 'bookId',
                    'foreignField': '_id',
                    'as': 'bookId',
                },
            },
            {
                '$lookup': {
                    'from': 'bookauthors',
                    'localField': 'bookId.author',
                    'foreignField': '_id',
                    'as': 'author',
                },
            },
            {
                $unwind: {
                    'path': '$bookId',
                },
            },
            {
                $unwind: {
                    'path': '$author',
                },
            },
            {
                $project: {
                    'bookId._id': -1.0,
                    'bookId.title': -1.0,
                    'bookId.description': 1.0,
                    'userId': -1.0,
                    'chapterId': 1.0,
                    'bookId.coverImage': {
                        $concat: [
                            awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/',
                            '$bookId.coverImage',
                        ],
                    },
                    'bookId.coverImageBackground': 1.0,
                    'bookId.chapters.name': 1.0,
                    'bookId.chapters._id': 1.0,
                    'author._id': 1.0,
                    'author.name': 1.0,
                    'bookId.overview': 1.0,
                    'highLights': 1.0,
                    'createdAt': -1.0,
                    'updatedAt': 1.0,
                },
            },
        ])
        if (!result.length && filter.bookId) {
            return { highLightsBooks: [{ count: 0, highlights: [] }] }
        }
        const newResult = []
        await Promise.all(await result.map(async (item: any) => {
            const bookDetails = item?.bookId
            if (!bookDetails) return
            const chapterDetails: any = bookDetails.chapters.find((oneChapter: any) => String(oneChapter._id) === String(item.chapterId))
            const authorDetails = item?.author
            const existingHighLight = newResult.findIndex(o => String(o.bookId) === String(bookDetails._id))

            if (filter.bookId) {
                item.highLights.map(oneItem => {
                    oneItem.chapter = chapterDetails
                    oneItem.highLightId = item._id
                })
            }

            if (existingHighLight === -1) {
                newResult.push({
                    bookId: bookDetails._id,
                    userId: item.userId,
                    title: bookDetails.title,
                    description: bookDetails.description,
                    coverImage: bookDetails.coverImage,
                    coverImageBackground: bookDetails.coverImageBackground,
                    author: authorDetails,
                    overview: bookDetails.overview,
                    highLights: item.highLights,
                    count: item.highLights && item.highLights.length ? item.highLights.length : 0,
                    updatedAt: item.updatedAt,
                })
            } else {
                const existingUpdatedAt = newResult[existingHighLight].updatedAt
                newResult[existingHighLight].highLights
                    = newResult[existingHighLight].highLights.concat(item.highLights)
                newResult[existingHighLight].updatedAt
                    = new Date(existingUpdatedAt).getTime() <
                        new Date(item.updatedAt).getTime()
                        ? item.updatedAt : existingUpdatedAt
                newResult[existingHighLight].count
                    = newResult[existingHighLight].count + item.highLights.length
            }
        }))

        /** filters results by search */
        result = newResult.filter(i => {
            /** if book have not highlights then should not return */
            if (!i || !i?.highLights?.length) return false
            i.highLights =
                i.highLights.sort((a, b) =>
                    (new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime())
                        ? -1
                        : ((new Date(b.updatedAt).getTime() > new Date(a.updatedAt).getTime()) ? 1 : 0))
            if (!search) {
                i.highLights = i.highLights.slice(skip, limit ? skip + limit : i.highLights.length)
                return true
            } else if (i.title.toLowerCase().includes(search)) {
                i.highLights = i.highLights.slice(skip, limit ? skip + limit : i.highLights.length)
                return true
            } else if (i.author && i.author.name.toLowerCase().includes(search)) {
                i.highLights = i.highLights.slice(skip, limit ? skip + limit : i.highLights.length)
                return true
            } else if (filter.bookId && i.highLights.find(o => o.chapter.name.toLowerCase().includes(search))) {
                i.highLights = i.highLights.slice(skip, limit ? skip + limit : i.highLights.length)
                return true
            } else if (filter.bookId) {
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
                i.highLights = i.highLights.slice(skip, limit ? skip + limit : i.highLights.length)
                return i.highLights.length ? true : false
            }
            return false
        })
        result = result.sort((a, b) =>
            (new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime())
                ? -1 : ((new Date(b.updatedAt).getTime() > new Date(a.updatedAt).getTime()) ? 1 : 0))
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
            { '_id': id, userId },
            {
                '$pull': {
                    'highLights': { '_id': highLightId },
                },
            }
        )
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove high lights */
const deleteHighLights = async (query: object) => {
    try {
        await HighLightsModel.deleteMany(query)
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
    deleteHighLight,
    deleteHighLights,
}
