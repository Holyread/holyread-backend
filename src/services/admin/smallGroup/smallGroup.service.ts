import { SmallGroupModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const smallGroupControllerResponse = responseMessage.smallGroupControllerResponse
const NODE_ENV = config.NODE_ENV

/** Add small group */
const createSmallGroup = async (body: any) => {
    try {
        const result = await SmallGroupModel.create(body)
        if (!result) {
            throw new Error(smallGroupControllerResponse.createSmallGroupFailure)
        }
        if (result.coverImage) {
            result.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.smallGroupDirectory + '/' + result.coverImage
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify small group */
const updateSmallGroup = async (body: any, id: string) => {
    try {
        const data: any = await SmallGroupModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        )
        if (data && data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.smallGroupDirectory + '/' + data.coverImage
        }
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get small group by category id */
const getOneSmallGroupByFilter = async (query: any) => {
    try {
        const result: any = await SmallGroupModel.findOne(query).populate('books', 'title coverImage').lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all small group for table */
const getAllSmallGroups = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await SmallGroupModel.find(search).populate('books', 'title').skip(skip).limit(limit).sort(sort).lean()
        const count = await SmallGroupModel.find(search).countDocuments()
        if (result.length) {
            await Promise.all(result.map(item => {
                if (item && item.coverImage) {
                    item.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.smallGroupDirectory + '/' + item.coverImage
                }
            }))
        }
        return { count, smallGroups: result }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove small group */
const deleteSmallGroup = async (id: string) => {
    try {
        await SmallGroupModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all small group for table */
const getSmallGroupsList = async () => {
    try {
        const result = await SmallGroupModel.find().populate('books', 'title').lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createSmallGroup,
    updateSmallGroup,
    getAllSmallGroups,
    getOneSmallGroupByFilter,
    deleteSmallGroup,
    getSmallGroupsList,
}
