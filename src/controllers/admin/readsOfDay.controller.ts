import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import readsOfDayService from '../../services/admin/readsOfDay/readsOfDay.service'
import { responseMessage } from '../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp } from '../../lib/utils/utils'
import { awsBucket, dataTable } from '../../constants/app.constant'
import config from '../../../config'

const readsOfDayControllerResponse = responseMessage.readsOfDayControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.readsOfDayDirectory}`,
}

/** Add read of day */
const addReadOfDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        /** Get read of day from db */
        const readOfDay: any = await readsOfDayService.getOneReadOfDayByFilter({ title: req.body.title })
        if (readOfDay) {
            return next(Boom.badData(readsOfDayControllerResponse.createReadOfDayFailure))
        }
        if (body.image) {
            body.image = await uploadImageToAwsS3(body.image, body.title, s3Bucket)
        }
        const data = await readsOfDayService.createReadOfDay({
            title: body.title,
            subTitle: body.subTitle,
            shortDescription: body.shortDescription,
            description: body.description,
            image: body.image,
            status: body.status || 'Active'
        })
        res.status(200).send({
            message: readsOfDayControllerResponse.createReadOfDaySuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one read of day by id */
const getOneReadOfDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get read of day from db */
        const data: any = await readsOfDayService.getOneReadOfDayByFilter({ _id: id })
        if (data && data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.readsOfDayDirectory + '/' + data.image
        }
        if (!data) {
            return next(Boom.notFound(readsOfDayControllerResponse.getReadOfDayFailure))
        }
        res.status(200).send({ message: readsOfDayControllerResponse.fetchReadOfDaySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all read of day by filter */
const getAllReadsOfDay = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'shortDescription': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) }
                ]
            }
        }

        const readsOfDaySorting = [];
        switch (params.column) {
            case 'title':
                readsOfDaySorting.push(['title', params.order || 'ASC']);
                break;
            case 'createdAt':
                readsOfDaySorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                readsOfDaySorting.push(['title', 'DESC']);
                break;
        }

        const data = await readsOfDayService.getAllReadsOfDay(Number(skip), Number(limit), searchFilter, readsOfDaySorting)
        response.status(200).json({ message: readsOfDayControllerResponse.fetchReadsOfDaySuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update read of day */
const updateReadOfDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get read of day from db */
        const readOfDayDetails: any = await readsOfDayService.getOneReadOfDayByFilter({ _id: id })
        if (!readOfDayDetails) {
            return next(Boom.notFound(readsOfDayControllerResponse.getReadOfDayFailure))
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(readOfDayDetails.image, s3Bucket)
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeImageToAwsS3(readOfDayDetails.image, s3Bucket)
            req.body.image = await uploadImageToAwsS3(req.body.image, readOfDayDetails.title, s3Bucket)
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = readOfDayDetails.image
        }
        await readsOfDayService.updateReadOfDay(req.body, id)
        return res.status(200).send({ message: readsOfDayControllerResponse.updateReadOfDaySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove read of day */
const deleteReadOfDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const readOfDayDetails: any = await readsOfDayService.getOneReadOfDayByFilter({ _id: id })
        if (readOfDayDetails && readOfDayDetails.image) {
            await removeImageToAwsS3(readOfDayDetails.image, s3Bucket)
        }
        await readsOfDayService.deleteReadOfDay(id)
        return res.status(200).send({ message: readsOfDayControllerResponse.deleteReadOfDaySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addReadOfDay, getOneReadOfDay, getAllReadsOfDay, updateReadOfDay, deleteReadOfDay }
