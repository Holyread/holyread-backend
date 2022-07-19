import { ReadsOfDayModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all read of day for app */
const getAllReadsOfDays = async (skip: number, limit, search: object, sort) => {
    try { 
        let readsOfTheDayList: any = await ReadsOfDayModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        let count: any = await ReadsOfDayModel.count(search).lean().exec()
        readsOfTheDayList = await Promise.all(readsOfTheDayList.map(async (item: any) => {
            return {
                _id: item._id,
                image: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + item.image,
                title: item.title,
                subTitle: item.subTitle,
            }
        }))
        return { readsOfTheDayList, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllReadsOfDays,
}
