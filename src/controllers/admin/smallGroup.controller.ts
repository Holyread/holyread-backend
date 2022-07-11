import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import smallGroupService from '../../services/admin/smallGroup/smallGroup.service'
import bookSummaryService from '../../services/admin/book/bookSummary.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp, removeImageToAwsS3, uploadImageToAwsS3 } from '../../lib/utils/utils'
import { awsBucket, dataTable } from '../../constants/app.constant'
import config from '../../../config'

const smallGroupControllerResponse = responseMessage.smallGroupControllerResponse
const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.smallGroupDirectory}`,
}

/** Add small group */
const addSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const existingSmallGroup: any = await smallGroupService.getOneSmallGroupByFilter({ title: body.title })
        if (existingSmallGroup) {
            return next(Boom.notFound(smallGroupControllerResponse.createSmallGroupFailure))
        }
        if (body.books.length) {
            body.books = await Promise.all(body.books.filter(async (oneBook) => {
                const bookDetails = await bookSummaryService.getOneBookSummaryByFilter({ _id: oneBook })
                return bookDetails ? true : false
            }))
        }
        if (body.coverImage) {
            body.coverImage = await uploadImageToAwsS3(body.coverImage, body.title, s3Bucket)
        }
        const data = await smallGroupService.createSmallGroup(body)
        res.status(200).send({
            message: smallGroupControllerResponse.createSmallGroupSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one small group by id */
const getOneSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get small group from db */
        const data: any = await smallGroupService.getOneSmallGroupByFilter({ _id: id })
        if (!data) {
            return next(Boom.notFound(smallGroupControllerResponse.getSmallGroupFailure))
        }
        if (data.books.length) {
            data.books.forEach(element => {
                if (element && element.coverImage) {
                    element.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.bookDirectory + '/coverImage/' + element.coverImage
                }
            });
        }
        if (data.coverImage) {
            data.coverImage = awsBucket[NODE_ENV].s3BaseURL + '/' + awsBucket.smallGroupDirectory + '/' + data.coverImage
        }
        res.status(200).send({ message: smallGroupControllerResponse.fetchSmallGroupSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all small groups by filter */
const getAllSmallGroups = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            const search = await getSearchRegexp(params.search)
            searchFilter = {
                $or: [
                    { 'title': search }
                ]
            }
            if (Number(search)) {
                searchFilter['$or'].push({ 'fontSize': Number(search) })
            }
        }

        const smallGroupsSorting = [];
        switch (params.column) {
            case 'title':
                smallGroupsSorting.push(['title', params.order || 'ASC']);
                break;
            case 'iceBreaker':
                smallGroupsSorting.push(['iceBreaker', params.order || 'ASC']);
                break;
            case 'description':
                smallGroupsSorting.push(['description', params.order || 'ASC']);
                break;
            case 'introduction':
                smallGroupsSorting.push(['introduction', params.order || 'ASC']);
                break;
            case 'createdAt':
                smallGroupsSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                smallGroupsSorting.push(['title', 'DESC']);
                break;
        }

        const data = await smallGroupService.getAllSmallGroups(Number(skip), Number(limit), searchFilter, smallGroupsSorting)
        response.status(200).json({ message: smallGroupControllerResponse.fetchSmallGroupSuccess, data })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update small group */
const updateSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get small group from db */
        const smallGroupDetails: any = await smallGroupService.getOneSmallGroupByFilter({ _id: id })
        if (!smallGroupDetails) {
            return next(Boom.notFound(smallGroupControllerResponse.getSmallGroupFailure))
        }
        if (req.body.coverImage === null) {
            await removeImageToAwsS3(smallGroupDetails.coverImage, s3Bucket)
        }
        if (req.body.coverImage && req.body.coverImage.includes('base64')) {
            await removeImageToAwsS3(smallGroupDetails.coverImage, s3Bucket)
            req.body.coverImage = await uploadImageToAwsS3(req.body.coverImage, smallGroupDetails.title, s3Bucket)
        }
        if (req.body.coverImage && req.body.coverImage.startsWith('http')) {
            req.body.coverImage = smallGroupDetails.coverImage
        }
        await smallGroupService.updateSmallGroup(req.body, id)
        return res.status(200).send({ message: smallGroupControllerResponse.updateSmallGroupSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove small group */
const deleteSmallGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const smallGroupDetails = await smallGroupService.getOneSmallGroupByFilter({ _id: id })
        if (smallGroupDetails && smallGroupDetails.coverImage) {
            await removeImageToAwsS3(smallGroupDetails.coverImage, s3Bucket)
        }
        await smallGroupService.deleteSmallGroup(id)
        return res.status(200).send({ message: smallGroupControllerResponse.deleteSmallGroupSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addSmallGroup, getOneSmallGroup, getAllSmallGroups, updateSmallGroup, deleteSmallGroup }
