import { SmallGroupModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'

const smallGroupControllerResponse = responseMessage.smallGroupControllerResponse

/** Add small group */
const createSmallGroup = async (body: any) => {
    try {
        const result = await SmallGroupModel.create(body)
        if (!result) {
            throw new Error(smallGroupControllerResponse.createSmallGroupFailure)
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
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get small group by category id */
const getOneSmallGroupByFilter = async (query: any) => {
    try {
        const result: any = await SmallGroupModel.findOne(query).populate('books', 'title').lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all small group for table */
const getAllSmallGroups = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await SmallGroupModel.find(search).populate('books', 'title').skip(skip).limit(limit).sort(sort).lean()
        const count = await SmallGroupModel.find(search).count()
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

export default {
    createSmallGroup,
    updateSmallGroup,
    getAllSmallGroups,
    getOneSmallGroupByFilter,
    deleteSmallGroup
}
