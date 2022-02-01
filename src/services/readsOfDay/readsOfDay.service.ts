import { ReadsOfDayModel } from '../../models/index'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import { responseMessage } from '../../constants/message.constant'

const NODE_ENV = config.NODE_ENV
const readsOfDayControllerResponse = responseMessage.readsOfDayControllerResponse

/** Add read of day */
const createReadOfDay = async (body: any) => {
    try {
        const result = await ReadsOfDayModel.create(body)
        if (!result) {
            throw new Error(readsOfDayControllerResponse.createReadOfDayFailure)
        }
        if (result.image) {
            result.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + result.image
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify read of day */
const updateReadOfDay = async (body: any, id: string) => {
    try {
        const data: any = await ReadsOfDayModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + data.image
        }
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get read of day by reads id */
const getOneReadOfDayByFilter = async (query: any) => {
    try {
        const result: any = await ReadsOfDayModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all read of day for table */
const getAllReadsOfDay = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await ReadsOfDayModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await ReadsOfDayModel.find(search).count()
        await Promise.all(result.map(async (item: any) => {
            if (!item) {
                return
            }
            if (item.image) {
                item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + item.image
            }
        }))
        return { count, reads: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove reads of day */
const deleteReadOfDay = async (id: string) => {
    try {
        await ReadsOfDayModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createReadOfDay,
    updateReadOfDay,
    getAllReadsOfDay,
    getOneReadOfDayByFilter,
    deleteReadOfDay
}
