import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import expertCurutedService from '../../../services/book/expertCuruted.service'
import { responseMessage } from '../../../constants/message.constant'
import { removeImageToAwsS3, uploadImageToAwsS3, getSearchRegexp } from '../../../lib/utils/utils'
import { awsBucket, dataTable } from '../../../constants/app.constant'
import config from '../../../../config'

const expertCurutedControllerResponse = responseMessage.expertCurutedControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.bookDirectory}`,
}

/** Add book summary */
const addExpertCuruted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        /** Get expert curuted from db */
        const expertCurutedDetails: any = await expertCurutedService.getOneExpertCurutedByFilter({ title: req.body.title })
        if (expertCurutedDetails) {
            return next(Boom.badData(expertCurutedControllerResponse.createExpertCurutedFailure))
        }
        if (body.image) {
            body.image = await uploadImageToAwsS3(body.image, body.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCuruted' })
        }

        const data = await expertCurutedService.createExpertCuruted(body)
        res.status(200).send({
            message: expertCurutedControllerResponse.createExpertCurutedSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one expert curuted by id */
const getOneExpertCuruted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get expert curuted from db */
        const data: any = await expertCurutedService.getOneExpertCurutedByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(expertCurutedControllerResponse.getExpertCurutedFailure))
        }
        if (data.image) {
            data.image = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/expertCuruted/' + data.image
        }

        res.status(200).send({ message: expertCurutedControllerResponse.fetchExpertCurutedSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all book summary by filter */
const getAllExpertCuruted = async (request: Request, response: Response, next: NextFunction) => {
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
        const expertCurutedSorting = [];
        switch (params.column) {
            case 'title':
                expertCurutedSorting.push(['title', params.order || 'ASC']);
                break;
            case 'status':
                expertCurutedSorting.push(['status', params.order || 'ASC']);
                break;
            case 'createdAt':
                expertCurutedSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                expertCurutedSorting.push(['title', 'DESC']);
                break;
        }

        const data = await expertCurutedService.getAllExpertCuruted(Number(skip), Number(limit), searchFilter, expertCurutedSorting)
        response.status(200).json({ message: expertCurutedControllerResponse.fetchAllExpertCurutedSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update expert curuted */
const updateExpertCuruted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get expert curuted from db */
        const expertCurutedDetail: any = await expertCurutedService.getOneExpertCurutedByFilter({ _id: id })
        if (!expertCurutedDetail) {
            return next(Boom.notFound(expertCurutedControllerResponse.getExpertCurutedFailure))
        }
        if (req.body.image === null) {
            await removeImageToAwsS3(expertCurutedDetail.image, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCuruted' })
        }
        if (req.body.image && req.body.image.includes('base64')) {
            await removeImageToAwsS3(expertCurutedDetail.image, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCuruted' })
            req.body.image = await uploadImageToAwsS3(req.body.image, expertCurutedDetail.title, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCuruted' })
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = expertCurutedDetail.image
        }

        await expertCurutedService.updateExpertCuruted(req.body, id)
        return res.status(200).send({ message: expertCurutedControllerResponse.updateExpertCurutedSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove expert curuted */
const deleteExpertCuruted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const expertCurutedDetail: any = await expertCurutedService.getOneExpertCurutedByFilter({ _id: id })
        if (expertCurutedDetail && expertCurutedDetail.image) {
            await removeImageToAwsS3(expertCurutedDetail.image, { ...s3Bucket, documentDirectory: s3Bucket.documentDirectory + '/expertCuruted' })
        }
        await expertCurutedService.deleteExpertCuruted(id)
        return res.status(200).send({ message: expertCurutedControllerResponse.deleteExpertCurutedSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export {
    addExpertCuruted,
    getOneExpertCuruted,
    getAllExpertCuruted,
    updateExpertCuruted,
    deleteExpertCuruted
}
