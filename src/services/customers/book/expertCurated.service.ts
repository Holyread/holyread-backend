import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { ExpertCuratedModel } from '../../../models/index'
import { randomNumberInRange } from '../../../lib/utils/utils'

const NODE_ENV = config.NODE_ENV

/** Get all expert Curated for app */
const getAllExpertCurateds = async (skip: number, limit, search: object, sort) => {
    try {
        let curatedList = await ExpertCuratedModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        let count = await ExpertCuratedModel.count(search).lean().exec()
        if (curatedList.length) {
            curatedList = await Promise.all(curatedList.map(item => {
                if (item && item.image) {
                    item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + item.image
                }
                return {
                    _id: item._id,
                    title: item.title,
                    description: item.description,
                    shortDescription: item.shortDescription,
                    image: item.image,
                    views: randomNumberInRange(1000, 5000)
                }
            }))
        }
        return { curatedList, count }
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

export default {
    getAllExpertCurateds,
    getOneExpertCuratedByFilter
};
