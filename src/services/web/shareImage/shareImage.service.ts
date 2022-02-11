import { ShareImageModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { responseMessage } from '../../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const shareImageControllerResponse = responseMessage.shareImageControllerResponse

/** Add share image */
const createShareImage = async (body: any) => {
    try {
        const result = await ShareImageModel.create(body)
        if (!result) {
            throw new Error(shareImageControllerResponse.createShareImageFailure)
        }
        if (result.image) {
            result.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.shareImageDirectory + '/' + result.image
        }
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
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.shareImageDirectory + '/' + data.image
        }
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
        const count = await ShareImageModel.find(search).count()
        await Promise.all(result.map(async (item: any) => {
            if (!item) {
                return
            }
            if (item.image) {
                item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.shareImageDirectory + '/' + item.image
            }
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
    deleteShareImage
}
