import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { ExpertCuratedModel } from '../../../models/index'

const NODE_ENV = config.NODE_ENV

/** Get all expert Curated for app */
const getAllExpertCurateds = async (skip: number, limit, search: any, sort) => {
    try {
        search.publish = true
        const page: any = [{ $skip: skip }]
        const count = await ExpertCuratedModel.find(search).countDocuments()

        const aggregate: any = new Set([
            {
                $project: {
                    title: 1.0,
                    views: 1.0,
                    status: 1.0,
                    publish: 1.0,
                    description: 1.0,
                    shortDescripion: 1.0,
                    image: {
                        $concat: [
                            awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/',
                            '$image',
                        ],
                    },
                },
            },
        ])

        if (Object.keys(search).length) {
            aggregate.add({
                $match: search,
            })
        }
        aggregate.add({
            $sort: sort,
        })
        aggregate.add({
            $sample: { size: count },
        })
        aggregate.add({
            $facet: {
                page
                    : limit
                        ? page.concat({ $limit: limit })
                        : page,
                total: [{
                    $count: 'count',
                }],
            },
        })

        const result
            = await ExpertCuratedModel
                .aggregate([
                    ...aggregate,
                ])

        return {
            curatedList: result[0]?.page,
            count: result[0].total[0]?.count,
        }
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

/** update expert Curated  by id */
const updateOneExpertCurated = async (query: any, data: any) => {
    try {
        await ExpertCuratedModel.findOneAndUpdate(query, data).lean()
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllExpertCurateds,
    updateOneExpertCurated,
    getOneExpertCuratedByFilter,
};
