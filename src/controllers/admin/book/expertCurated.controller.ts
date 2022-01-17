import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import expertCuratedService from '../../../services/book/expertCurated.service'
import { responseMessage } from '../../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'

const expertCuratedControllerResponse = responseMessage.expertCuratedControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.bookDirectory}`,
}

/** Add expert curated */
const addExpertCurated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        /** Get expert Curated from db */
        const expertCuratedDetails: any = await expertCuratedService.getOneExpertCuratedByFilter({ title: req.body.title })
        if (expertCuratedDetails) {
            return next(Boom.badData(expertCuratedControllerResponse.createExpertCuratedFailure))
        }
        if (body.image) {
            body.image = await uploadImageToAwsS3(body.image, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCurated' })
        }

        const data = await expertCuratedService.createExpertCurated(body)
        res.status(200).send({
            message: expertCuratedControllerResponse.createExpertCuratedSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one expert Curated by id */
const getOneExpertCurated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get expert Curated from db */
        const data: any = await expertCuratedService.getOneExpertCuratedByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(expertCuratedControllerResponse.getExpertCuratedFailure))
        }
        if (data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCurated/' + data.image
        }

        res.status(200).send({ message: expertCuratedControllerResponse.fetchExpertCuratedSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book summary by filter */
const getAllExpertCurated = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'title': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                    { 'description': await getSearchRegexp(params.search) }
                ]
            }
        }
        const expertCuratedSorting = [];
        switch (params.column) {
            case 'title':
                expertCuratedSorting.push(['title', params.order || 'ASC']);
                break;
            case 'status':
                expertCuratedSorting.push(['status', params.order || 'ASC']);
                break;
            case 'createdAt':
                expertCuratedSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                expertCuratedSorting.push(['title', 'DESC']);
                break;
        }

        const data = await expertCuratedService.getAllExpertCurated(Number(skip), Number(limit), searchFilter, expertCuratedSorting)
        response.status(200).json({ message: expertCuratedControllerResponse.fetchAllExpertCuratedSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update expert Curated */
const updateExpertCurated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get expert Curated from db */
        const expertCuratedDetail: any = await expertCuratedService.getOneExpertCuratedByFilter({ _id: id })
        if (!expertCuratedDetail) {
            return next(Boom.notFound(expertCuratedControllerResponse.getExpertCuratedFailure))
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(expertCuratedDetail.image, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCurated' })
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeImageToAwsS3(expertCuratedDetail.image, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCurated' })
            req.body.image = await uploadImageToAwsS3(req.body.image, expertCuratedDetail.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCurated' })
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = expertCuratedDetail.image
        }

        await expertCuratedService.updateExpertCurated(req.body, id)
        return res.status(200).send({ message: expertCuratedControllerResponse.updateExpertCuratedSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove expert Curated */
const deleteExpertCurated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const expertCuratedDetail: any = await expertCuratedService.getOneExpertCuratedByFilter({ _id: id })
        if (expertCuratedDetail && expertCuratedDetail.image) {
            await removeImageToAwsS3(expertCuratedDetail.image, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCurated' })
        }
        await expertCuratedService.deleteExpertCurated(id)
        return res.status(200).send({ message: expertCuratedControllerResponse.deleteExpertCuratedSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export {
    addExpertCurated,
    getOneExpertCurated,
    getAllExpertCurated,
    updateExpertCurated,
    deleteExpertCurated
}
