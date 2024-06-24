import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import shareImageService from '../../services/admin/shareImage/shareImage.service'
import { responseMessage } from '../../constants/message.constant'
import { removeS3File, uploadFileToS3, getSearchRegexp, getImageUrl } from '../../lib/utils/utils'
import { awsBucket, dataTable } from '../../constants/app.constant'
import config from '../../../config'

const shareImageControllerResponse = responseMessage.shareImageControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.shareImageDirectory}`,
}

/** Add share image */
const addShareImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        if (body.image) {
            const s3File: any = await uploadFileToS3(body.image, body.fontColor, s3Bucket)
            body.image = s3File.name
        }
        const data = await shareImageService.createShareImage({
            fontSize: body.fontSize,
            fontColor: body.fontColor,
            image: body.image,
        })
        res.status(200).send({
            message: shareImageControllerResponse.createShareImageSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one share image by id */
const getOneShareImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get share image from db */
        const data: any = await shareImageService.getOneShareImageByFilter({ _id: id })
        if (!data) return next(Boom.notFound(shareImageControllerResponse.getShareImageFailure))
        if (data && data.image) data.image = getImageUrl(data.image, awsBucket.shareImageDirectory);


        res.status(200).send({ message: shareImageControllerResponse.fetchShareImageSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all share images by filter */
const getAllShareImages = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            const search = await getSearchRegexp(params.search)
            searchFilter = {
                $or: [
                    { 'fontColor': search },
                ],
            }
            if (Number(search)) {
                searchFilter['$or'].push({ 'fontSizr': Number(search) })
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const shareImageSorting = ['fontColor', 'fontSize', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['fontColor', 'desc']];

        const data = await shareImageService.getAllShareImage(Number(skip), Number(limit), searchFilter, shareImageSorting)
        response.status(200).json({ message: shareImageControllerResponse.fetchShareImageSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update share image */
const updateShareImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get share image from db */
        const shareImageDetails: any = await shareImageService.getOneShareImageByFilter({ _id: id })
        if (!shareImageDetails) return next(Boom.notFound(shareImageControllerResponse.getShareImageFailure))

        if (req.body.image === null) await removeS3File(shareImageDetails.image, s3Bucket)

        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(shareImageDetails.image, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.image, shareImageDetails.fontColor + shareImageDetails.fontSize, s3Bucket)
            req.body.image = s3File.name
        }
        if (req.body.image && req.body.image.startsWith('http')) req.body.image = shareImageDetails.image

        await shareImageService.updateShareImage(req.body, id)
        return res.status(200).send({ message: shareImageControllerResponse.updateShareImageSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove share image */
const deleteShareImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const shareImageDetails: any = await shareImageService.getOneShareImageByFilter({ _id: id })
        if (shareImageDetails && shareImageDetails.image) await removeS3File(shareImageDetails.image, s3Bucket)
        await shareImageService.deleteShareImage(id)
        return res.status(200).send({ message: shareImageControllerResponse.deleteShareImageSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addShareImage, getOneShareImage, getAllShareImages, updateShareImage, deleteShareImage }
