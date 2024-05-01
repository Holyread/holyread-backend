import { BookCategoryModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'

const NODE_ENV = config.NODE_ENV

/** Get all book categories */
const getAllBookCategories = async (skip: number, limit, search: object, sort) => {
    try {
        const page: any = [{ $skip: skip }]
        const result = await BookCategoryModel.aggregate([
            {
                $project: {
                    title: 1.0,
                    image: { $concat: [
                        awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/category/',
                        '$image',
                    ] },
                    status: 1.0,
                },
            },
            {
                $match: search,
            },
            {
                $sort: sort,
            },
            {
                $facet: {
                    page
                        : limit
                        ? page.concat({ $limit: limit })
                        : page,
                    total: [{
                        $count: 'count',
                    }],
                },
            },
        ])
        const count = result[0].total[0].count
        return { categories: result[0]?.page, count }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get book category by category id */
const getCategoriesDetails = async (categoryIds: string[]) => {
    try {
        const result = await BookCategoryModel.find({ _id: { $in: categoryIds } }).lean();
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
        throw new Error(e);
    }
}

export default {
    getAllBookCategories,
    getCategoriesDetails,
}
