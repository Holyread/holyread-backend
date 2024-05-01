import { ReadsOfDayModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all read of day for app */
const getAllReadsOfDays = async (skip: number, limit, search: object, sort) => {
    try {
        const readsOfTheDayList: any = await ReadsOfDayModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count: any = await ReadsOfDayModel.countDocuments(search).lean().exec()
        readsOfTheDayList.map(async (item: any) => {
            item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + item.image
        })
        return { readsOfTheDayList, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllReadsOfDays,
}
