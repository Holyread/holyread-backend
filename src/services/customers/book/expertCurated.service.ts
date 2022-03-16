import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { ExpertCuratedModel } from '../../../models/index'

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
                    totalReads: 100
                }
            }))
        }
        return { curatedList, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all expert Curated for web */
const getAllExpertCuratedsCount = async () => {
    try {
        let result = await ExpertCuratedModel.find({}).count().lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllExpertCurateds,
    getAllExpertCuratedsCount
};
