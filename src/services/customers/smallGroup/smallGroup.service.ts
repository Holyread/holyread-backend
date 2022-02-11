import { SmallGroupModel } from '../../../models/index'

/** Get all small group for app */
const getAllSmallGroups = async (skip: number, limit, search: object, sort) => {
    try {
        let result: any = await SmallGroupModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        result = result.map(item => {
            return {
                _id: item._id,
                iceBreaker: item.iceBreaker,
                introduction: item.introduction,
                title: item.title,
                description: item.description,
                backgroundColor: item.backgroundColor,
            }
        })
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllSmallGroups
}
