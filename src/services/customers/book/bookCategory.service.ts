import { BookCategoryModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all book categories */
const getAllBookCategories = async (skip: number, limit, search: object, sort) => {
    try {
        const result = await BookCategoryModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        await Promise.all(result.map(async (item: any) => {
            if (!item) {
                return
            }
            if (item.image) {
                item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/category/' + item.image
            }
        }))
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookCategories
}
