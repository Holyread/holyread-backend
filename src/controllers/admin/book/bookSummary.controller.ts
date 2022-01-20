import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import bookCategoryService from '../../../services/book/bookCategory.service'
import bookSummaryService from '../../../services/book/bookSummary.service'
import recommendedBookService from '../../../services/book/recommendedBook.service'
import { responseMessage } from '../../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'

const bookCategoryControllerResponse = responseMessage.bookCategoryControllerResponse
const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

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
            body.coverImage = await uploadImageToAwsS3(body.coverImage, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
        }
        if (body.chapters && body.chapters.length) {
            await Promise.all(body.chapters.map(async oneChapter => {
                if (oneChapter.audioFile) {
                    oneChapter.audioFile = await uploadImageToAwsS3(oneChapter.audioFile, oneChapter.name, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                }
            }));
        }
        if (body.videoFile) {
            body.videoFile = await uploadImageToAwsS3(body.videoFile, body.title + '-video', { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
        }
        const data = await bookSummaryService.createBookSummary(body)
        res.status(200).send({
            message: bookSummaryControllerResponse.createBookSummarySuccess,
            data
        })
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
        if (data.category) {
            const categoryDetails = await bookCategoryService.getOneBookCategoryByFilter({ _id: data.category })
            data.category = categoryDetails.title
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
        if (params.names === 'true') {
            const query = params.category ? { categories: { $in: [params.category] } } : {}
            const data = await bookSummaryService.getAllBookSummariesNames(query)
            response.status(200).json({ message: bookSummaryControllerResponse.fetchBookSummariesSuccess, data })
            return
        }
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: any = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                    { 'author': await getSearchRegexp(params.search) },
                    { 'description': await getSearchRegexp(params.search) },
                    { 'overview': await getSearchRegexp(params.search) },
                    { 'bookFor': await getSearchRegexp(params.search) },
                    { 'aboutAuthor': await getSearchRegexp(params.search) },
                    { 'chapters.name': await getSearchRegexp(params.search) }
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
                summarySorting.push(['title', 'DESC']);
                break;
        }
        if (params.status && params.status === 'NewlyAdded') {
            summarySorting = [['createdAt', 'DESC']];
        }
        const data = await bookSummaryService.getAllBookSummaries(Number(skip), Number(limit), searchFilter, summarySorting)
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
            await removeImageToAwsS3(summaryDetails.coverImage, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
        }
        if (req.body.coverImage && req.body.coverImage.includes('base64')) {
            await removeImageToAwsS3(summaryDetails.coverImage, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
            req.body.coverImage = await uploadImageToAwsS3(req.body.coverImage, summaryDetails.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
        }
        if (req.body.coverImage && req.body.coverImage.startsWith('http')) {
            req.body.coverImage = summaryDetails.coverImage
        }
        if (req.body.chapters && req.body.chapters.length) {
            await Promise.all(req.body.chapters.map(async oneChapter => {
                const chapterdetails = summaryDetails.chapters.find(item => String(item._id) === String(oneChapter._id))
                if (oneChapter.audioFile === null && chapterdetails && chapterdetails.audioFile) {
                    await removeImageToAwsS3(chapterdetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                }
                if (oneChapter.audioFile && oneChapter.audioFile.startsWith('http')) {
                    oneChapter.audioFile = chapterdetails && chapterdetails.audioFile ? chapterdetails.audioFile : ''
                    return
                }
                if (oneChapter.audioFile && oneChapter.audioFile.includes('base64')) {
                    if (chapterdetails && chapterdetails.audioFile) {
                        await removeImageToAwsS3(chapterdetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                    }
                    oneChapter.audioFile = await uploadImageToAwsS3(oneChapter.audioFile, oneChapter.name, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                }
            }));
        }
        if (req.body.videoFile === null) {
            await removeImageToAwsS3(summaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
        }
        if (req.body.videoFile && req.body.videoFile.startsWith('http')) {
            req.body.videoFile = summaryDetails.videoFile
        }
        if (req.body.videoFile && req.body.videoFile.includes('base64')) {
            if (summaryDetails.videoFile) {
                await removeImageToAwsS3(summaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
            }
            req.body.videoFile = await uploadImageToAwsS3(req.body.videoFile, summaryDetails.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
        }
        await bookSummaryService.updateBookSummary(req.body, id)
        return res.status(200).send({ message: bookCategoryControllerResponse.updateBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove book summary */
const deleteSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const bookSummaryDetails: any = await bookSummaryService.getOneBookSummaryByFilter({ _id: id })
        if (bookSummaryDetails) {
            const bookRecommendedBookDetails = await recommendedBookService.getOneRecommendedBookByFilter({ book: id })
            if (bookRecommendedBookDetails) {
                return next(Boom.notFound(bookSummaryControllerResponse.recommendedBookError))
            }
            if (bookSummaryDetails.image) {
                await removeImageToAwsS3(bookSummaryDetails.image, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/coverImage' })
            }
            if (bookSummaryDetails.audioFile) {
                await removeImageToAwsS3(bookSummaryDetails.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
            }
            if (bookSummaryDetails.chapters && bookSummaryDetails.chapters.length) {
                await Promise.all(bookSummaryDetails.chapters.map(async oneChapter => {
                    if (oneChapter.audioFile) {
                        await removeImageToAwsS3(oneChapter.audioFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/audio' })
                    }
                }));
            }
            if (bookSummaryDetails.videoFile) {
                await removeImageToAwsS3(bookSummaryDetails.videoFile, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
            }
        }
        await bookSummaryService.deleteBookSummary(id)
        return res.status(200).send({ message: bookCategoryControllerResponse.deleteBookCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addSummary, getOneSummary, getAllSummaries, updateSummary, deleteSummary }
