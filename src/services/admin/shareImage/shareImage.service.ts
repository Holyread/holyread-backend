import { ShareImageModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
import { getImageUrl } from '../../../lib/utils/utils'

const shareImageControllerResponse = responseMessage.shareImageControllerResponse
/** Add share image */
const createShareImage = async (body: any) => {
    try {
        const result = await ShareImageModel.create(body)

        if (!result) throw new Error(shareImageControllerResponse.createShareImageFailure)
        if (result.image) result.image = getImageUrl(result.image, awsBucket.shareImageDirectory);
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify share image */
const updateShareImage = async (body: any, id: string) => {
    try {
        const data: any = await ShareImageModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) data.image = getImageUrl(data.image, awsBucket.shareImageDirectory);
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get share image by category id */
const getOneShareImageByFilter = async (query: any) => {
    try {
        const result: any = await ShareImageModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all share image for table */
const getAllShareImage = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await ShareImageModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await ShareImageModel.find(search).countDocuments()
        await Promise.all(result.map(async (item: any) => {
            if (!item) return
            if (item.image) item.image = getImageUrl(item.image, awsBucket.shareImageDirectory);
            
        }))
        return { count, shareImages: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove share image */
const deleteShareImage = async (id: string) => {
    try {
        await ShareImageModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createShareImage,
    updateShareImage,
    getAllShareImage,
    getOneShareImageByFilter,
    deleteShareImage,
}
