import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookCategoryService from '../../../services/admin/book/bookCategory.service'
import bookSummaryService from '../../../services/admin/book/bookSummary.service'
import recommendedBookService from '../../../services/admin/book/recommendedBook.service'
import { responseMessage } from '../../../constants/message.constant'
import { removeS3File, uploadFileToS3, getSearchRegexp, randomNumberInRange } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'
import userService from '../../../services/admin/users/user.service';
import ratingService from '../../../services/customers/book/rating.service';

const bookCategoryControllerResponse = responseMessage.bookCategoryControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse
const passportResponse = responseMessage.passportResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.bookDirectory}`,
}

/** Add book summary */
const addSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        /** Get book summary from db */
        const summaryDetails: any = await bookSummaryService.getOneBookSummaryByFilter({ title: req.body.title })
        if (summaryDetails) {
            return next(Boom.badData(bookSummaryControllerResponse.createBookSummaryFailure))
        }
        if (req.body.categories && req.body.categories.length) {
            const categoryDetails: any = await bookCategoryService.getOneBookCategoryByFilter({ _id: { $in: req.body.categories } })
            if (!categoryDetails) {
                return next(Boom.badData(bookCategoryControllerResponse.getBookCategoryFailure))
            }
        }
        if (body.coverImage) {
            const s3File: any = await uploadFileToS3(body.coverImage, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
            body.coverImage = s3File.name
        }
        if (body.bookReadFile) {
            const s3File: any = await uploadFileToS3(body.bookReadFile, body.title + '-reads', { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/reads' })
            body.bookReadFile = s3File.name
        }
        if (body.chapters && body.chapters.length) {
            await Promise.all(body.chapters.map(async oneChapter => {
                if (oneChapter.audioFile) {
                    const s3File: any = await uploadFileToS3(oneChapter.audioFile, oneChapter.name, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                    oneChapter.audioFile = s3File.name
                    oneChapter.size = s3File.size
                }
            }));
        }
        if (body.videoFile) {
            const s3File: any = await uploadFileToS3(body.videoFile, body.title + '-video', { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
            body.videoFile = s3File.name
            body.videoFileSize = s3File.size
        }
        body.views = randomNumberInRange(5, 15);
        const data = await bookSummaryService.createBookSummary(body)
        res.status(200).send({
            message: bookSummaryControllerResponse.createBookSummarySuccess,
            data
        })
        const user = await userService.getOneUserByFilter({ email: 'bot@holyreads.com' })
        if (user) {
            await ratingService.updateRating({ bookId: data._id, star: Number(`${randomNumberInRange(3,5)}.${randomNumberInRange(1,5)}`), description: '', userId: user._id })
        }
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one book summary by id */
const getOneSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get summary from db */
        const data: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        if (data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + data.coverImage
        }
        if (data.bookReadFile) {
            data.bookReadFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/reads/' + data.bookReadFile
        }
        if (data.videoFile) {
            data.videoFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/video/' + data.videoFile
        }
        if (data.chapters && data.chapters.length) {
            data.chapters.forEach(async oneChapter => {
                if (oneChapter.audioFile) {
                    oneChapter.audioFile = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/audio/' + oneChapter.audioFile
                }
            });
        }
        if (data.categories) {
            const categoryObj = await bookCategoryService.getAllBookCategory(0, 0, { _id: { $in: data.categories } }, [['createdAt', 'DESC']])
            data.categories = categoryObj.categories
        }
        res.status(200).send({ message: bookSummaryControllerResponse.fetchBookSummarySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book summary by filter */
const getAllSummaries = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: any = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                ]
            }
        }
        if (params.status && params.status === 'MostPopular') {
            searchFilter.popular = true;
        }
        let summarySorting = [];
        switch (params.column) {
            case 'title':
                summarySorting.push(['title', params.order || 'ASC']);
                break;
            case 'status':
                summarySorting.push(['status', params.order || 'ASC']);
                break;
            case 'author':
                summarySorting.push(['author', params.order || 'ASC']);
                break;
            case 'createdAt':
                summarySorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                summarySorting.push(['title', 'ASC'])
                break;
        }
        if (params.status && params.status === 'NewlyAdded') {
            summarySorting = [['createdAt', 'DESC']];
        }
        const data: any = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), searchFilter, summarySorting)
        data.summaries.forEach((element: any) => {
            if (element && element.author && element.author.name) {
                element.author = element.author.name
            }
            if (element.coverImage) {
                element.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + element.coverImage
            }
        });
        response.status(200).json({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book summaries options list */
const getAllSummariesOptionsList = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const query = params.category ? { categories: { $in: [params.category] } } : {}
        const data = await bookSummaryService.getAllBookSummariesOptionsList(query)
        response.status(200).json({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update book summary */
const updateSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get book summary from db */
        const summaryDetails: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (!summaryDetails) {
            return next(Boom.notFound(bookSummaryControllerResponse.getBookSummaryFailure))
        }
        if (req.body.coverImage === null) {
            await removeS3File(summaryDetails.coverImage, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
        }
        if (req.body.coverImage && req.body.coverImage.includes('base64')) {
            await removeS3File(summaryDetails.coverImage, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
            const s3File: any = await uploadFileToS3(req.body.coverImage, summaryDetails.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
            req.body.coverImage = s3File.name
        }
        if (req.body.coverImage && req.body.coverImage.startsWith('http')) {
            req.body.coverImage = summaryDetails.coverImage
        }
        if (req.body.bookReadFile === null) {
            await removeS3File(summaryDetails.bookReadFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/reads' })
        }
        if (req.body.bookReadFile && req.body.bookReadFile.includes('base64')) {
            await removeS3File(summaryDetails.bookReadFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/reads' })
            const s3File: any = await uploadFileToS3(req.body.bookReadFile, summaryDetails.title + '-reads', { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/reads' })
            req.body.bookReadFile = s3File.name
        }
        if (req.body.bookReadFile && req.body.bookReadFile.startsWith('http')) {
            req.body.bookReadFile = summaryDetails.bookReadFile
        }
        if (req.body.chapters && req.body.chapters.length) {
            await Promise.all(req.body.chapters.map(async oneChapter => {
                const chapterdetails = summaryDetails.chapters.find(item => String(item._id) === String(oneChapter._id))
                if (oneChapter.audioFile === null && chapterdetails && chapterdetails.audioFile) {
                    await removeS3File(chapterdetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                    oneChapter.size = 0
                }
                if (oneChapter.audioFile && oneChapter.audioFile.startsWith('http')) {
                    oneChapter.audioFile = chapterdetails && chapterdetails.audioFile ? chapterdetails.audioFile : ''
                    oneChapter.size = chapterdetails.size || 0
                    return
                }
                if (oneChapter.audioFile && oneChapter.audioFile.includes('base64')) {
                    if (chapterdetails && chapterdetails.audioFile) {
                        await removeS3File(chapterdetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                    }
                    const s3File: any = await uploadFileToS3(oneChapter.audioFile, oneChapter.name, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                    oneChapter.audioFile = s3File.name
                    oneChapter.size = s3File.size
                }
            }));
        }
        if (req.body.videoFile === null) {
            await removeS3File(summaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
        }
        if (req.body.videoFile && req.body.videoFile.startsWith('http')) {
            req.body.videoFile = summaryDetails.videoFile
        }
        if (req.body.videoFile && req.body.videoFile.includes('base64')) {
            if (summaryDetails.videoFile) {
                await removeS3File(summaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
            }
            const s3File: any = await uploadFileToS3(req.body.videoFile, summaryDetails.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
            req.body.videoFile = s3File.name
            req.body.videoFileSize = s3File.size
        }
        await bookSummaryService.updateBookSummary(req.body, id)
        return res.status(200).send({ message: bookCategoryControllerResponse.updateBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove book summary */
const deleteSummary = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        if(req.user.type === 'SubAdmin'){
            return next(Boom.unauthorized(passportResponse.unauthorized));
        }
        const id: any = req.params.id
        const bookSummaryDetails: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (bookSummaryDetails) {
            const bookRecommendedBookDetails = await recommendedBookService.getOneRecommendedBookByFilter({ book: id })
            if (bookRecommendedBookDetails) {
                return next(Boom.notFound(bookSummaryControllerResponse.recommendedBookError))
            }
            if (bookSummaryDetails.coverImage) {
                await removeS3File(bookSummaryDetails.coverImage, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
            }
            if (bookSummaryDetails.bookReadFile) {
                await removeS3File(bookSummaryDetails.bookReadFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/reads' })
            }
            if (bookSummaryDetails.audioFile) {
                await removeS3File(bookSummaryDetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
            }
            if (bookSummaryDetails.chapters && bookSummaryDetails.chapters.length) {
                await Promise.all(bookSummaryDetails.chapters.map(async oneChapter => {
                    if (oneChapter.audioFile) {
                        await removeS3File(oneChapter.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                    }
                }));
            }
            if (bookSummaryDetails.videoFile) {
                await removeS3File(bookSummaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
            }
        }
        await bookSummaryService.deleteBookSummary(id)
        return res.status(200).send({ message: bookCategoryControllerResponse.deleteBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addSummary, getOneSummary, getAllSummaries, getAllSummariesOptionsList, updateSummary, deleteSummary }
