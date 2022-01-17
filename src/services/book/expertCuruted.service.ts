import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import { ExpertCurutedModel } from '../../models/index'
import { responseMessage } from '../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const expertCurutedControllerResponse = responseMessage.expertCurutedControllerResponse

const createExpertCuruted = async (body: any) => {
    try {
        const result = await ExpertCurutedModel.create(body)
        if (!result) {
            throw new Error(expertCurutedControllerResponse.createExpertCurutedFailure)
        }
        if (result.image) {
            result.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCuruted' + result.image
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify Expert curuted */
const updateExpertCuruted = async (body: any, id: string) => {
    try {
        const data: any = await ExpertCurutedModel.updateOne(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.expertCurutedDirectory + '/' + data.image
        }
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get expert curuted  by id */
const getOneExpertCurutedByFilter = async (query: any) => {
    try {
        const data: any = await ExpertCurutedModel.findOne(query).lean()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all expert curuted for table */
const getAllExpertCuruted = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await ExpertCurutedModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await ExpertCurutedModel.find(search).count()
        return { count, data: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove exprt curuted */
const deleteExpertCuruted = async (id: string) => {
    try {
        await ExpertCurutedModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}


export default {
    createExpertCuruted,
    getAllExpertCuruted,
    getOneExpertCurutedByFilter,
    updateExpertCuruted,
    deleteExpertCuruted
};
