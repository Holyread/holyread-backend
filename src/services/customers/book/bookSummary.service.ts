import { BookSummaryModel, BookAuthorModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import usersService from '../users/user.service'
import ratingService from './rating.service'
import { IBookSummary } from '../../../models/bookSummary.model'
import { FilterQuery } from 'mongoose'

const NODE_ENV = config.NODE_ENV

/** Get all book summaries with filter by author id or author name, book title or all */
const getAllBookSummariesForDiscover = async (skip: number, limit, search: any, sort) => {
    try {
        search.search.publish = true

        const totalCount = await BookSummaryModel.find({ publish: true }).countDocuments()

        const result: any
            = await BookSummaryModel
                .aggregate([
                    {
                        $project: {
                            title: 1.0,
                            views: 1.0,
                            author: 1.0,
                            bookFor: 1.0,
                            publish: 1.0,
                            overview: 1.0,
                            categories: 1.0,
                            coverImage: 1.0,
                            description: 1.0,
                            totalStar: 1.0,
                            coverImageBackground: 1.0,
                        },
                    },
                    {
                        $lookup: {
                            as: 'author',
                            foreignField: '_id',
                            from: 'bookauthors',
                            localField: 'author',
                        },
                    },
                    {
                        $match: search.search,
                    },
                    { $sample: { size: totalCount } },
                    {
                        $facet: {
                            page: [
                                { $skip: skip },
                                { $limit: limit },
                            ],
                            total: [
                                {
                                    $count: 'count',
                                },
                            ],
                        },
                    },
                ]);

        const count = result[0].total[0]?.count || 0
        const ratings = await ratingService.getBooksRatings(result[0]?.page?.map(i => i && i._id).filter(i => i) as [string], global.currentUser._id)
        const summaries = new Set()
        const libraries = await usersService.getUserLibrary({ _id: global?.currentUser?.libraries })
        const saved = libraries?.saved

        await Promise.all(result[0]?.page?.map(async oneItem => {
            summaries.add({
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                description: oneItem.description,
                author: oneItem.author[0] || {},
                overview: oneItem.overview,
                views: oneItem.views || 0,
                bookFor: oneItem.bookFor,
                bookMark: !!saved?.find(b => String(b) === String(oneItem?._id)),
                coverImageBackground: oneItem.coverImageBackground,
                categories: oneItem.categories,
                isRate: !!ratings[String(oneItem._id)]?.isRate,
                totalStar: oneItem.totalStar,
                publish: oneItem.publish,
            })
        }))

        return { count, summaries: [...summaries] }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get user libraries book summaries */
const getAllBookSummaries = async (skip: number, limit: number, search: any, sort, library?: any) => {
    try {
        search.publish = true
        const aggregate: any = new Set([
            {
                '$project': {
                    '_id': -1.0,
                    'title': 1.0,
                    'author': 1.0,
                    'bookFor': 1.0,
                    'publish': 1.0,
                    'overview': 1.0,
                    'description': 1.0,
                    'coverImage': {
                        $concat: [
                            awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/',
                            '$coverImage',
                        ],
                    },
                    'views': '$views',
                    'createdAt': -1.0,
                    'categories': 1.0,
                    'chapters.name': 1.0,
                    'chapters.size': 1.0,
                    'totalStar': 1.0,
                    'coverImageBackground': 1.0,
                },
            },
            {
                $lookup: {
                    from: 'bookauthors',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: '$author',
            },
            {
                $project: {
                    'author.__v': 0,
                    'author.createdAt': 0,
                },
            },
            {
                $sort: sort,
            },
        ])

        if (Object.keys(search).length) {
            aggregate.add({
                $match: search,
            })
        }
        const page: any = [{ $skip: skip }]

        aggregate.add({
            $facet: {
                page: limit ? page.concat({ $limit: limit }) : page,
                total: [
                    {
                        $count: 'count',
                    },
                ],
            },
        })

        let result: any
            = await BookSummaryModel
                .aggregate([
                    ...aggregate,
                ])

        const count: any = result[0]?.total[0]?.count
        const ratings
            = await ratingService
                .getBooksRatings(
                    result[0]
                        ?.page
                        .map(
                            i =>
                                i && i._id
                        )
                        .filter(
                            i => i
                        ) as [string],
                    global.currentUser._id
                )

        const libraries = await usersService.getUserLibrary({ _id: global?.currentUser?.libraries })

        result
            = await Promise.all(
                result[0]?.page.map(async oneItem => {
                    const libBookChapters = libraries
                        ?.reading
                        ?.find(
                            item =>
                                String(
                                    item.bookId
                                )
                                ===
                                String(oneItem._id)
                        )
                        ?.chaptersCompleted

                    return {
                        ...oneItem,
                        author: oneItem.author,
                        isRate: !!ratings[String(oneItem._id)]?.isRate,
                        chapters: library ? oneItem.chapters : undefined,
                        reads: Number(
                            (
                                libBookChapters && libBookChapters?.length
                                    ? (100 * libBookChapters?.length) / oneItem?.chapters?.length
                                    : 0
                            ).toFixed(0)
                        ),
                        bookMark: libraries?.saved?.find(
                            b => String(b) === String(oneItem._id)
                        ) ? true : false,
                        'views': oneItem.views || 0,
                    };
                }
                ))
        return {
            count,
            summaries: result.filter(i => i),
        }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get book summary by summary id */
const getOneBookSummaryByFilter = async (query: any) => {
    try {
        const data: any = await BookSummaryModel.findOne(query).lean().exec()
        if (!data) return data;
        const ratings = await ratingService.getBooksRatings([String(data._id)], global.currentUser._id)
        const libraries = await usersService.getUserLibrary({ _id: global?.currentUser?.libraries })
        const libBookChapters = libraries?.reading?.find(item => String(item.bookId) === String(data._id))?.chaptersCompleted
        if (data.author) {
            data.author = await BookAuthorModel.findOne({ _id: data.author }).lean().exec()
        }
        data.isRate = !!ratings[String(data._id)]?.isRate
        data.views = data.views || 0
        data.bookMark = libraries?.saved?.find(b => String(b) === String(data?._id)) ? true : false
        data.reads = Number((libBookChapters?.length ? (100 * libBookChapters?.length) / data?.chapters?.length : 0).toFixed(0))
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get book summary */
const findBook = async (query: any) => {
    try {
        const data: any = await BookSummaryModel.findOne(query).lean().exec()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

const getMostPopularBooks = async (skip: number, limit: number, search: any, sort: any, library?: any) => {
    try {
        search.publish = true;

        // Convert the Set to an array to use MongoDB aggregation stages properly
        const aggregate: any[] = [
            {
                '$project': {
                    '_id': 1,  // Use 1 to include these fields
                    'title': 1,
                    'author': 1,
                    'bookFor': 1,
                    'publish': 1,
                    'overview': 1,
                    'description': 1,
                    'coverImage': {
                        $concat: [
                            awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/',
                            '$coverImage',
                        ],
                    },
                    'views': '$views',
                    'createdAt': 1,
                    'categories': 1,
                    'chapters.name': 1,
                    'chapters.size': 1,
                    'totalStar': 1,
                    'coverImageBackground': 1,
                },
            },
            {
                $lookup: {
                    from: 'bookauthors',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: '$author',
            },
            {
                $project: {
                    'author.__v': 0,
                    'author.createdAt': 0,
                },
            },
            {
                $sort: sort, // Sort based on the specified field
            },
            {
                $limit: 100,
            },
            {
                $sample: { size: 100 } // Randomly select books up to the limit
            },
        ];

        // Add search criteria if there are any
        if (Object.keys(search).length) {
            aggregate.unshift({
                $match: search, // Apply search filters before the sampling
            });
        }

        // Add pagination and counting using $facet
        aggregate.push({
            $facet: {
                page: [{ $skip: skip }], // Apply pagination with skip
                total: [{ $count: 'count' }], // Count total number of documents after filtering
            },
        });

        // Execute the aggregation pipeline
        let result: any = await BookSummaryModel.aggregate(aggregate);

        // Fetch the total count
        const count: any = result[0]?.total[0]?.count;

        // Fetch ratings for the books
        const ratings = await ratingService.getBooksRatings(
            result[0]?.page.map((i) => i && i._id).filter((i) => i) as [string],
            global.currentUser._id
        );

        // Fetch user library information
        const libraries = await usersService.getUserLibrary({ _id: global?.currentUser?.libraries });

        // Process the result to include additional fields
        result = await Promise.all(
            result[0]?.page.map(async (oneItem) => {
                const libBookChapters = libraries?.reading?.find(
                    (item) => String(item.bookId) === String(oneItem._id)
                )?.chaptersCompleted;

                return {
                    ...oneItem,
                    author: oneItem.author,
                    isRate: !!ratings[String(oneItem._id)]?.isRate,
                    chapters: library ? oneItem.chapters : undefined,
                    reads: Number(
                        (
                            libBookChapters && libBookChapters.length
                                ? (100 * libBookChapters.length) / oneItem.chapters.length
                                : 0
                        ).toFixed(0)
                    ),
                    bookMark: libraries?.saved?.find((b) => String(b) === String(oneItem._id)) ? true : false,
                    views: oneItem.views || 0,
                };
            })
        );

        // Return the final result with the count of books and summaries
        return {
            count,
            summaries: result.filter((i) => i),
        };
    } catch (e: any) {
        throw new Error(e);
    }
};

/** Modify book summary */
const updateBookSummary = async (body: any, query: FilterQuery<IBookSummary>) => {
    try {
        await BookSummaryModel.updateOne(query, body)
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get books summary */
const findBooks = async (query: any) => {
    try {
        const data: any = await BookSummaryModel.find(query).select('categories _id').lean().exec()
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get random books summary */
const findRandomBooks = async (query: any, count: any) => {
    try {
        const data: any = await BookSummaryModel.aggregate([
            query,
            { $project: { categories: 1, _id: 1 } },
            { $sample: { size: count } },
        ])
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

const getAllBookSummariesForWebsite = async (search: any, sort: any) => {
    try {
        // Ensure that only published books are searched
        search.search.publish = true;

        // Get total document count for published summaries
        const totalCount = await BookSummaryModel.find({ publish: true }).countDocuments();

        // Perform aggregation to get all book summaries without pagination
        const result: any = await BookSummaryModel.aggregate([
            {
                $project: {
                    title: 1.0,
                    author: 1.0,
                    publish: 1.0,
                    categories: 1.0,
                    coverImage: 1.0,
                },
            },
            {
                $lookup: {
                    as: 'author',
                    foreignField: '_id',
                    from: 'bookauthors',
                    localField: 'author',
                },
            },
            {
                $match: search.search,
            },
            { $sample: { size: totalCount } },
        ]);

        // Transform result into a summary list
        const summaries = result.map((oneItem: any) => ({
            _id: oneItem._id,
            coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
            title: oneItem.title,
            author: oneItem.author[0] || {},
            categories: oneItem.categories,
            publish: oneItem.publish,
        }));

        return { summaries };
    } catch (e: any) {
        throw new Error(e);
    }
};


export default {
    getAllBookSummaries,
    getAllBookSummariesForDiscover,
    getOneBookSummaryByFilter,
    findBook,
    getMostPopularBooks,
    updateBookSummary,
    findBooks,
    findRandomBooks,
    getAllBookSummariesForWebsite
}

/*
fix search
get one book with book author name instead of book author id

*/
