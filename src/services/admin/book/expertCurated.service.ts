import { awsBucket } from '../../../constants/app.constant'
import { ExpertCuratedModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'
import { getImageUrl } from '../../../lib/utils/utils'

const expertCuratedControllerResponse = responseMessage.expertCuratedControllerResponse

const createExpertCurated = async (body: any) => {
    try {
        const result = await ExpertCuratedModel.create(body)
        if (!result) {throw new Error(expertCuratedControllerResponse.createExpertCuratedFailure)}
        if (result.image) result.image = getImageUrl(result.image, `${awsBucket.bookDirectory}/expertCurated`);
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify Expert Curated */
const updateExpertCurated = async (body: any, id: string) => {
    try {
        const data: any = await ExpertCuratedModel.updateOne(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) data.image = getImageUrl(data.image, `${awsBucket.bookDirectory}/expertCurated`);
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get expert Curated  by id */
const getOneExpertCuratedByFilter = async (query: any) => {
    try {
        const data: any = await ExpertCuratedModel.findOne(query).lean()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all expert Curated for table */
const getAllExpertCurated = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await ExpertCuratedModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count: number = await ExpertCuratedModel.find(search).countDocuments()
        if (result.length) {
            await Promise.all(result.map(item => {
                if (item && item.image) item.image = getImageUrl(item.image, `${awsBucket.bookDirectory}/expertCurated`);
            }))
        }
        return { count, data: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove exprt Curated */
const deleteExpertCurated = async (id: string) => {
    try {
        await ExpertCuratedModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all expert Curated for table */
const getExpertCuratedList = async () => {
    try {
        const result = await ExpertCuratedModel.find().lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createExpertCurated,
    getAllExpertCurated,
    getOneExpertCuratedByFilter,
    updateExpertCurated,
    deleteExpertCurated,
    getExpertCuratedList,
};
