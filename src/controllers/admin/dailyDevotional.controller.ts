import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import dailyDevotionalService from '../../services/admin/dailyDevotional/dailyDevotional.service'
import { responseMessage } from '../../constants/message.constant'
import { removeS3File, uploadFileToS3, getSearchRegexp } from '../../lib/utils/utils'
import { awsBucket, dataTable } from '../../constants/app.constant'
import config from '../../../config'

const dailyDevotionalControllerResponse = responseMessage.dailyDevotionalControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.readsOfDayDirectory}`,
}

/** Add Daily Devotional */
const addDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        /** Get daily devotional from db */
        if (body.title) {
            const dailyDevotional: any = await dailyDevotionalService.getOneDailyDevotionalByFilter({ title: req.body.title })
            if (dailyDevotional) {
                return next(Boom.badData(dailyDevotionalControllerResponse.createDailyDevotionalFailure))
            }
        }

        if (body.image) {
            const s3File: any = await uploadFileToS3(body.image, body.title || 'read_of_day', s3Bucket)
            body.image = s3File.name
        }

        if (body.video) {
            const s3File: any =
                await uploadFileToS3(body.video, body.title || 'read_of_day' + '-video', { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video' })
            body.video = s3File.name
            body.videoFileSize = s3File.size
        }
        const data = await dailyDevotionalService.createDailyDevotional({
            title: body.title,
            subTitle: body.subTitle,
            description: body.description,
            video: body.video,
            image: body.image,
            category: body.category,
            status: body.status || 'Active',
        })
        res.status(200).send({
            message: dailyDevotionalControllerResponse.createDailyDevotionalSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one daily devotional by id */
const getOneDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get daily devotional from db */
        const data: any = await dailyDevotionalService.getOneDailyDevotionalByFilter({ _id: id })
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + data.image
        }

        if (data && data.video) {
            data.video = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/video/' + data.video
        }
        if (!data) {
            return next(Boom.notFound(dailyDevotionalControllerResponse.getDailyDevotionalFailure))
        }
        res.status(200).send({ message: dailyDevotionalControllerResponse.fetchDailyDevotionalSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all daily devotional by filter */
const getAllDailyDevotional = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params: any = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchQuery = {}
        if (params.search) {
            searchQuery = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'category': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                ],
            }
        }

        const searchFilter = { ...searchQuery };

        const readsOfDaySorting = [];
        switch (params.column) {
            case 'title':
                readsOfDaySorting.push(['title', params.order || 'asc']);
                break;
            case 'category':
                readsOfDaySorting.push(['category', params.order || 'asc']);
                break;
            case 'category':
                readsOfDaySorting.push(['createdAt', params.order || 'asc']);
                break;
            default:
                readsOfDaySorting.push(['createdAt', 'desc']);
                break;
        }

        const data = await dailyDevotionalService.getAllDailyDevotional(Number(skip), Number(limit), searchFilter, readsOfDaySorting)
        response.status(200).json({ message: dailyDevotionalControllerResponse.fetchDailyDevotionalsSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update daily devotional */
const updateDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get daily devotional from db */
        const readOfDayDetails: any = await dailyDevotionalService.getOneDailyDevotionalByFilter({ _id: id })
        if (!readOfDayDetails) {
            return next(Boom.notFound(dailyDevotionalControllerResponse.getDailyDevotionalFailure))
        }
        if (req.body.image === null) {
            await removeS3File(readOfDayDetails.image, s3Bucket)
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(readOfDayDetails.image, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.image, readOfDayDetails.title || 'read_of_day', s3Bucket)
            req.body.image = s3File.name
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = readOfDayDetails.image
        }
        await dailyDevotionalService.updateDailyDevotional(req.body, id)
        return res.status(200).send({ message: dailyDevotionalControllerResponse.updateDailyDevotionalSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove daily devotional */
const deleteDailyDevotional = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const readOfDayDetails: any = await dailyDevotionalService.getOneDailyDevotionalByFilter({ _id: id })
        if (readOfDayDetails && readOfDayDetails.image) {
            await removeS3File(readOfDayDetails.image, s3Bucket)
        }
        await dailyDevotionalService.deleteDailyDevotional(id)
        return res.status(200).send({ message: dailyDevotionalControllerResponse.deleteDailyDevotionalSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export {
    addDailyDevotional,
    getAllDailyDevotional,
    updateDailyDevotional,
    deleteDailyDevotional,
    getOneDailyDevotional,
}
