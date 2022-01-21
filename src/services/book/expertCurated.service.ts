import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import { ExpertCuratedModel } from '../../models/index'
import { responseMessage } from '../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const expertCuratedControllerResponse = responseMessage.expertCuratedControllerResponse

const createExpertCurated = async (body: any) => {
    try {
        body.status = 'Active'
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
        if (body.status === true) body.status = 'Active'
        if (body.status === false) body.status = ' Deactive'
        const data: any = await ExpertCuratedModel.updateOne(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + data.image
        }
        data.status === 'Active' ? data.status = true : data.status = false 
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get expert Curated  by id */
const getOneExpertCuratedByFilter = async (query: any) => {
    try {
        const data: any = await ExpertCuratedModel.findOne(query).lean()
        if (data) {
            data.status === 'Active' ? data.status = true : data.status = false
      }
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all expert Curated for table */
const getAllExpertCurated = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await ExpertCuratedModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await ExpertCuratedModel.find(search).count()
        if (result.length) {
            await Promise.all(result.map(item => {
                if (item && item.image) {
                    item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + item.image
                }
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


export default {
    createExpertCurated,
    getAllExpertCurated,
    getOneExpertCuratedByFilter,
    updateExpertCurated,
    deleteExpertCurated
};
