import { BookSummaryModel, BookAuthorModel, UserModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import config from '../../../../config'
import { randomNumberInRange } from '../../../lib/utils/utils'
import usersService from '../users/user.service'
import ratingService from './rating.service'

const NODE_ENV = config.NODE_ENV

/** Get all book summaries with filter by author id or author name, book title or all */
const getAllBookSummariesForDiscover = async (skip: number, limit, search: any, sort) => {
    try {
        let result: any
            = await BookSummaryModel
                .aggregate([
                    {
                        $project: {
                            title: 1.0,
                            author: 1.0,
                            overview: 1.0,
                            categories: 1.0,
                            coverImage: 1.0,
                            description: 1.0,
                            coverImageBackground: 1.0,
                            bookFor: 1.0
                        }
                    },
                    {
                        $lookup: {
                            as: 'author',
                            foreignField: '_id',
                            from: 'bookauthors',
                            localField: 'author',
                        }
                    },
                    {
                        $match: search.search
                    },
                    {
                        $facet: {
                            page: [
                                { $skip: skip },
                                { $limit: limit }
                            ],
                            total: [
                                {
                                    $count: 'count'
                                }
                            ]
                        }
                    }
                ]);

        delete search.star;

        const star = search.star;
        const count = result[0].total[0].count
        const ratings = await ratingService.getBooksRatings(result[0]?.page?.map(i => i && i._id).filter(i => i) as [string], global.currentUser._id)
        const summaries = new Set()
        const libraries = await usersService.getUserLibrary({ _id: global?.currentUser?.libraries })
        const saved = libraries?.saved

        await Promise.all(result[0]?.page?.map(async oneItem => {
            const totalStar = ratings[String(oneItem._id)]?.averageStar || 3
            if (star && star !== Math.trunc(totalStar)) return

            summaries.add({
                _id: oneItem._id,
                coverImage: awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + oneItem.coverImage,
                title: oneItem.title,
                description: oneItem.description,
                author: oneItem.author[0] || {},
                overview: oneItem.overview,
                views: oneItem.views || randomNumberInRange(10000, 20000),
                bookFor: oneItem.bookFor,
                bookMark: !!saved?.find(b => String(b) === String(oneItem?._id)),
                coverImageBackground: oneItem.coverImageBackground,
                categories: oneItem.categories,
                isRate: !!ratings[String(oneItem._id)]?.isRate,
                totalStar
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
        const star = search.star
        delete search.star
        const aggregate: any = new Set([
            {
                '$project': {
                    '_id': -1.0,
                    'title': 1.0,
                    'author': 1.0,
                    'overview': 1.0,
                    'bookFor': 1.0,
                    'description': 1.0,
                    'coverImage': {
                        $concat: [
                            awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/',
                            '$coverImage'
                        ]
                    },
                    'coverImageBackground': 1.0,
                    'categories': 1.0,
                    'views': '$views',
                    'chapters.name': 1.0,
                    'chapters.size': 1.0
                }
            },
            {
                $lookup: {
                    from: "bookauthors",
                    localField: "author",
                    foreignField: "_id",
                    as: "author"
                }
            },
            {
                $unwind: '$author'
            },
            {
                $project: {
                    'author.__v': 0,
                    'author.createdAt': 0,
                }
            }
        ])

        if (Object.keys(search).length) {
            aggregate.add({
                $match: search
            })
        }
        const page: any = [{ $skip: skip }]

        aggregate.add({
            $facet: {
                page: limit ? page.concat({ $limit: limit }) : page,
                total: [
                    {
                        $count: 'count'
                    }
                ]
            }
        })

        let result: any
            = await BookSummaryModel
                .aggregate([
                    ...aggregate
                ])

        let count: any = result[0]?.total[0]?.count
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
                    const totalStar = ratings[String(oneItem._id)]?.averageStar || 3
                    if (star && star !== Math.trunc(totalStar)) {
                        --count;
                        return false
                    }
                    return {
                        totalStar,
                        ...oneItem,
                        author: oneItem.author,
                        isRate: !!ratings[String(oneItem._id)]?.isRate,
                        chapters: library ? oneItem.chapters : undefined,
                        reads: Number((libBookChapters && libBookChapters?.length ? (100 * libBookChapters?.length) / oneItem?.chapters?.length : 0).toFixed(0)),
                        isSaved: libraries?.saved?.find(
                            b => String(b) === String(oneItem._id)
                        ) ? true : false,
                        'views': oneItem.views || randomNumberInRange(10000, 20000),
                    }
                }
                ))
        return {
            count,
            summaries: result.filter(i => i)
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
        data.totalStar = ratings[String(data._id)]?.averageStar || 3,
            data.isRate = !!ratings[String(data._id)]?.isRate
        data.views = data.views || randomNumberInRange(10000, 20000)
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

const getMostPopularBooks = async (skip: number, limit: number) => {
    try {
        const _id = 'libraries.reading._id';
        const email = 'libraries.reading.email'
        const bookId = 'libraries.reading.bookId._id'
        const views = 'libraries.reading.bookId.views'
        const title = 'libraries.reading.bookId.title'
        const updatedAt = 'libraries.reading.updatedAt'
        const author = 'libraries.reading.bookId.author'
        const overview = 'libraries.reading.bookId.overview'
        const chapters = 'libraries.reading.bookId.chapters._id'
        const categories = 'libraries.reading.bookId.categories'
        const coverImage = 'libraries.reading.bookId.coverImage'
        const description = 'libraries.reading.bookId.description'
        const bookFor = 'libraries.reading.bookId.bookFor'
        const coverImageBackground = 'libraries.reading.bookId.coverImageBackground'

        const project = {
            [_id]: '$'+ [_id],
            [email]: '$' + [email],
            [title]: '$' + [title],
            [views]: '$' + [views],
            [bookFor]: '$' + [bookFor],
            [bookId]: '$' + [bookId],
            [author]: '$' + [author],
            [overview]: '$' + [overview],
            [updatedAt]: '$' + [updatedAt],
            [categories]: '$' + [categories],
            [description]: '$' + [description],
            [coverImageBackground]: '$' + [coverImageBackground],
            [chapters]: '$' + [chapters],
            [coverImage]: {
                $concat: [
                    awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/',
                    '$' + [coverImage]
                ]
            }
        }

        const select = {
            'title': { $first: '$' + [title] },
            'views': { $first: '$' + [views] },
            'bookFor': { $first: '$' + [bookFor] },
            'author': { $first: '$' + [author] },
            'chapters': { $first: '$' + [chapters] },
            'overview': { $first: '$' + [overview] },
            'updatedAt': { $first: '$' + [updatedAt] },
            'categories': { $first: '$' + [categories] },
            'coverImage': { $first: '$' + [coverImage] },
            'description': { $first: '$' + [description] },
            'coverImageBackground': { $first: '$' + [coverImageBackground] },
        }

        const page: any = [{ $limit: limit }]

        let result = await UserModel.aggregate(
            [
                {
                    '$match': {
                        'libraries': {
                            '$exists': true
                        }
                    }
                },
                {
                    "$lookup": {
                        "from": "userlibraries",
                        "localField": "libraries",
                        "foreignField": "_id",
                        "as": "libraries"
                    }
                },
                {
                    '$unwind': {
                        'path': '$libraries'
                    }
                },
                {
                    '$match': {
                        'libraries.reading.bookId': {
                            '$exists': true
                        }
                    }
                },
                {
                    '$unwind': {
                        'path': '$libraries.reading'
                    }
                },
                {
                    "$lookup": {
                        "from": "booksummaries",
                        "localField": "libraries.reading.bookId",
                        "foreignField": "_id",
                        "as": "libraries.reading.bookId"
                    }
                },
                {
                    '$unwind': {
                        'path': '$libraries.reading.bookId'
                    }
                },
                {
                    '$project': project
                },
                {
                    '$match': {
                        'libraries.reading.bookId._id': { $exists: true }
                    }
                },
                {
                    '$group': {
                        '_id': '$libraries.reading.bookId._id',
                        'emails': {
                            '$push': {
                                'email': '$email'
                            }
                        },
                        ...select
                    }
                },
                {
                    '$group': {
                        '_id': '$_id',
                        'total': {
                            '$sum': {
                                '$size': '$emails'
                            }
                        },
                        'title': { $first: '$title' },
                        'views': { $first: '$views' },
                        'bookFor': { $first: '$bookFor' },
                        'author': { $first: '$author' },
                        'chapters': {
                            '$sum': {
                                '$size': '$chapters'
                            }
                        },
                        'overview': { $first: '$overview' },
                        'updatedAt': { $first: '$updatedAt' },
                        'categories': { $first: '$categories' },
                        'coverImage': { $first: '$coverImage' },
                        'description': { $first: '$description' },
                        'coverImageBackground': { $first: '$coverImageBackground' },   
                    }
                },
                {
                    '$sort': {
                        'total': -1.0
                    }
                },
                {
                    "$lookup": {
                        "from": "bookauthors",
                        "localField": "author",
                        "foreignField": "_id",
                        "as": "author"
                    }
                },
                {
                    $project: { 
                        'author.createdAt': 0, 
                        'author.__v': 0, 
                    }
                },
                {
                    $facet: {
                        page
                            : skip
                            ? page.concat({ $skip: skip })
                            : page,
                        total: [{
                            $count: 'count'
                        }]
                    }
                }
            ]
        )
        const count = result[0]?.total[0]?.count
        
        const ratings
            = await ratingService
                .getBooksRatings(
                    result[0].page.map(
                        i => i.book && i.book._id
                    )
                    .filter(i => i) as [string],
                    global.currentUser._id
                )

        const libraries
            = await usersService
                .getUserLibrary({
                    _id: global.currentUser.libraries
                })
        const summaries = new Set();

        await Promise.all(result[0].page.map(oneItem => {
            const isSaved
                = libraries
                    ?.saved
                    ?.find(
                        b =>
                            String(b) === String(oneItem?._id)
                    )
                    ? true : false

            const libBookChapters
                = libraries
                    ?.reading
                    ?.find(
                        item =>
                        String(item.bookId) === String(oneItem._id)
                    )?.chaptersCompleted

            summaries.add({
                ...oneItem,
                author: oneItem.author[0],
                bookMark: isSaved,
                isRate: !!ratings[String(oneItem._id)]?.isRate,
                views: oneItem.views || randomNumberInRange(10000, 20000),
                totalStar: ratings[String(oneItem._id)]?.averageStar || 3,
                reads: Number(
                    (
                        libBookChapters?.length
                        ?
                            (
                                100 * libBookChapters?.length
                            ) / oneItem?.chapters
                        : 0
                    ).toFixed(0)),
            })
        }))

        return {
            count,
            summaries: [...summaries],
        }

    } catch (e: any) {
        throw new Error(e)
    }
}


/** Modify book summary */
const updateBookSummary = async (body: any, query: object) => {
    try {
        await BookSummaryModel.updateOne(query, body)
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    getAllBookSummaries,
    getAllBookSummariesForDiscover,
    getOneBookSummaryByFilter,
    findBook,
    getMostPopularBooks,
    updateBookSummary
}

/*
fix search 
get one book with book author name instead of book author id

*/
