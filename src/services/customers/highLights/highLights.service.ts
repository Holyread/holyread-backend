import { HighLightsModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'

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
            newBody['highLights.$.color'] = body.color
        }
        if (body.note) {
            newBody['highLights.$.note'] = body.note
        }
        if (body.textDecoration) {
            newBody['highLights.$.textDecoration'] = body.textDecoration
        }
        const data: any = await HighLightsModel.findOneAndUpdate(
            { 'highLights._id': id },
            {
                '$set': newBody
            }
        ).lean().exec()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get high lights by category id */
const getHighLightsByFilter = async (query: any) => {
    try {
        const result: any = await HighLightsModel.find(query).lean().exec()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove high light */
const deleteHighLight = async (id: string, highLightId: string) => {
    try {
        await HighLightsModel.findOneAndUpdate(
            { '_id': id },
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
