import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import { ExpertCuratedModel } from '../../models/index'
import { responseMessage } from '../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const expertCuratedControllerResponse = responseMessage.expertCuratedControllerResponse

const createExpertCurated = async (body: any) => {
    try {
        const result = await ExpertCuratedModel.create(body)
        if (!result) {
            throw new Error(expertCuratedControllerResponse.createExpertCuratedFailure)
        }
        if (result.image) {
            result.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + result.image
        }
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
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + data.image
        }
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
const getAllExpertCurated = async (skip: number, limit, search: object, sort, isForApp?: any) => {
    try {
        const result = await ExpertCuratedModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count: number = await ExpertCuratedModel.find(search).count()
        if (result.length) {
            await Promise.all(result.map(item => {
                if (item && item.image) {
                    item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + item.image
                }
            }))
        }
        return isForApp ? result : { count, data: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all expert Curated for app */
const getAllExpertCuratedsForApp = async (skip: number, limit, search: object, sort) => {
    try {
        let result = await ExpertCuratedModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        if (result.length) {
            result = await Promise.all(result.map(item => {
                if (item && item.image) {
                    item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + item.image
                }
                return {
                    _id: item._id,
                    title: item.title,
                    description: item.description,
                    shortDescription: item.shortDescription,
                    image: item.image,
                    totalReads: 100
                }
            }))
        }
        return result
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


export default {
    createExpertCurated,
    getAllExpertCurated,
    getAllExpertCuratedsForApp,
    getOneExpertCuratedByFilter,
    updateExpertCurated,
    deleteExpertCurated
};
