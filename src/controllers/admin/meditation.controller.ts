import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import meditationService from '../../services/admin/meditation/meditation.service'
import { responseMessage } from '../../constants/message.constant'
import { getImageUrl, getSearchRegexp, removeS3File, uploadFileToS3 } from '../../lib/utils/utils'
import { dataTable, awsBucket } from '../../constants/app.constant'
import { IMeditation } from '../../models/meditation.model';
import { FilterQuery } from 'mongoose';
import config from '../../../config'

const meditationControllerResponse = responseMessage.meditationControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.meditationDirectory}`,
}

/** Add Meditation */
const addMeditation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const meditation = await meditationService.getOneMeditationByFilter({ title: req.body.title })
        if (meditation) return next(Boom.badData(meditationControllerResponse.createMeditationFailure))
        if (body.image) {
            const s3File: any = await uploadFileToS3(body.image, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory})
            body.image = s3File.name
        }

        if(body.video) {
            const s3File: any = await uploadFileToS3(body.video, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/video'})
            body.video = s3File.name
        }

        const bodyData = {
            ...body,
            image: body.image,
            video: body.video
        }

        const meditationObj: any = await meditationService.createMeditation(bodyData)

        res.status(200).send({
            message: meditationControllerResponse.createMeditationSuccess,
            data: meditationObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one meditation by id */
const getOneMeditation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get meditation from db */
        const meditationObj: any = await meditationService.getOneMeditationByFilter({ _id: id })
        if (!meditationObj) {
            return next(Boom.notFound(meditationControllerResponse.createMeditationFailure))
        }
        if (meditationObj.image) meditationObj.image = getImageUrl(meditationObj.image, `${awsBucket.meditationDirectory}`);
        if (meditationObj.video) meditationObj.video = getImageUrl(meditationObj.video, `${awsBucket.meditationDirectory}/video`);
        res.status(200).send({
            message: meditationControllerResponse.fetchMeditationSuccess,
            data: meditationObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all meditations */
const getAllMeditations = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: FilterQuery<IMeditation> = {}

        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                    { status: await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const meditationSorting = ['title', 'status', 'category', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['createdAt', 'desc']];

        const getMeditationsList = await meditationService.getAllMeditations(Number(skip), Number(limit), searchFilter, meditationSorting)
        response.status(200).json({ message: meditationControllerResponse.fetchAllMeditationSuccess, data: getMeditationsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update Meditation */
const updateMeditation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        /** Get faq from db */
        const meditationObj: any = await meditationService.getOneMeditationByFilter({ _id: id })
        if (!meditationObj) {
            return next(Boom.notFound(meditationControllerResponse.getMeditationFailure))
        }

        if (req.body.image === null) await removeS3File(meditationObj.image, s3Bucket)
        if (req.body.video === null) await removeS3File(meditationObj.video, s3Bucket)

        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(meditationObj.image, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.image, meditationObj.title, s3Bucket)
            req.body.image = s3File.name
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = meditationObj.image
        }

        if (req.body.video && req.body.video.includes('base64')) {
            await removeS3File(meditationObj.video, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.video, meditationObj.title, s3Bucket)
            req.body.video = s3File.name
        }
        if (req.body.video && req.body.video.startsWith('https')) req.body.video = meditationObj.video

        const updatedMeditation = {
            ...req.body,
            image: req.body.image,
            video: req.body.video,
        };
        const data = await meditationService.updateMeditation(updatedMeditation, id)
        return res.status(200).send({ message: meditationControllerResponse.updateMeditationSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove Meditation */
const deleteMeditation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        const meditationObj = await meditationService.getOneMeditationByFilter({ _id: id });

        if (meditationObj) {
            if (meditationObj.image) await removeS3File(meditationObj.image, s3Bucket);
            if (meditationObj.video) await removeS3File(meditationObj.video, s3Bucket);
        }
        await meditationService.deleteMeditation(id)
        return res.status(200).send({ message: meditationControllerResponse.deleteMeditationSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addMeditation, getOneMeditation, getAllMeditations, updateMeditation, deleteMeditation }
