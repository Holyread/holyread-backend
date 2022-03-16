import { BookCategoryModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all book categories */
const getAllBookCategories = async (skip: number, limit, search: object, sort) => {
    try {
        const categories = await BookCategoryModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await BookCategoryModel.count(search).lean().exec()
        await Promise.all(categories.map(async (item: any) => {
            if (!item) {
                return
            }
            if (item.image) {
                item.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/category/' + item.image
            }
        }))
        return { categories, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookCategories
}
