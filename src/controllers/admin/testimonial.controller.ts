import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import testimonialService from '../../services/admin/testimonial/testimonial.service'
import { responseMessage } from '../../constants/message.constant'
import { removeS3File, uploadFileToS3, getSearchRegexp, getImageUrl } from '../../lib/utils/utils'
import { awsBucket, dataTable } from '../../constants/app.constant'
import config from '../../../config'

const testimonialControllerResponse = responseMessage.testimonialControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.testimonialDirectory}`,
}

/** Add testimonial */
const addTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { body } = req
        /** Get testimonial from db */
        const testimonial: any = await testimonialService.getOneTestimonialByFilter({ name: req.body.name })
        if (testimonial) return next(Boom.badData(testimonialControllerResponse.createTestimonialFailure))

        if (body.image) {
            const s3File: any = await uploadFileToS3(body.image, body.name, s3Bucket)
            body.image = s3File.name
        }
        const data = await testimonialService.createTestimonial({
            name: body.name,
            image: body.image,
            description: body.description,
            status: 'Active',
        })
        res.status(200).send({
            message: testimonialControllerResponse.createTestimonialSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one testimonial by id */
const getOneTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get testimonial from db */
        const data: any = await testimonialService.getOneTestimonialByFilter({ _id: id })
        if (!data) return next(Boom.notFound(testimonialControllerResponse.getTestimonialFailure))
        if (data && data.image) data.image = getImageUrl(data.image, `${awsBucket.testimonialDirectory}`);

        res.status(200).send({ message: testimonialControllerResponse.fetchTestimonialSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all testimonial by filter */
const getAllTestimonial = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { 'name': await getSearchRegexp(params.search) },
                    { 'status': await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const testimonialSorting = ['name', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['name', 'desc']];

        const data = await testimonialService.getAllTestimonials(Number(skip), Number(limit), searchFilter, testimonialSorting)
        response.status(200).json({ message: testimonialControllerResponse.fetchTestimonialSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update testimonial */
const updateTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get testimonial from db */
        const testimonialDetails: any = await testimonialService.getOneTestimonialByFilter({ _id: id })
        if (!testimonialDetails) return next(Boom.notFound(testimonialControllerResponse.getTestimonialFailure))
        if (req.body.image === null) await removeS3File(testimonialDetails.image, s3Bucket)

        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(testimonialDetails.image, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.image, testimonialDetails.name, s3Bucket)
            req.body.image = s3File.name
        }
        if (req.body.image && req.body.image.startsWith('http')) req.body.image = testimonialDetails.image

        await testimonialService.updateTestimonial(req.body, id)
        return res.status(200).send({ message: testimonialControllerResponse.updateTestimonialSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove testimonial */
const deleteTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const testimonialDetails: any = await testimonialService.getOneTestimonialByFilter({ _id: id })
        if (testimonialDetails && testimonialDetails.image) await removeS3File(testimonialDetails.image, s3Bucket)
        await testimonialService.deleteTestimonial(id)
        return res.status(200).send({ message: testimonialControllerResponse.deleteTestimonialSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addTestimonial, getOneTestimonial, getAllTestimonial, updateTestimonial, deleteTestimonial }
