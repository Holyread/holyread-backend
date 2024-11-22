import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import meditationCategoryService from '../../services/admin/meditation/meditationCategory.service'
import meditationService from '../../services/admin/meditation/meditation.service'

import { responseMessage } from '../../constants/message.constant'
import { getImageUrl, getSearchRegexp, removeS3File, uploadFileToS3 } from '../../lib/utils/utils'
import { dataTable, awsBucket } from '../../constants/app.constant'
import { FilterQuery } from 'mongoose';
import config from '../../../config'
import { IMeditationCategory } from '../../models/meditationCategory.model';

const meditationCategoryControllerResponse = responseMessage.meditationCategoryControllerResponse

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
    region: awsBucket.region,
    bucketName: awsBucket[NODE_ENV].bucketName,
    documentDirectory: `${awsBucket.meditationDirectory}/category`,
}

/** Add Meditation Category */
const addMeditationCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        if (body.image) {
            const s3File: any = await uploadFileToS3(body.image, body.title, s3Bucket)
            body.image = s3File.name
        }

        const bodyData = {
            ...body,
            image: body.image,
        }

        const meditationCategoryObj: any = await meditationCategoryService.createMeditationCategory(bodyData)

        res.status(200).send({
            message: meditationCategoryControllerResponse.createMeditationCategorySuccess,
            data: meditationCategoryObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one meditation category by id */
const getOneMeditationCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get meditation category from db */
        const meditationCategoryObj: any = await meditationCategoryService.getOneMeditationCategoryByFilter({ _id: id })
        if (!meditationCategoryObj) {
            return next(Boom.notFound(meditationCategoryControllerResponse.createMeditationCategoryFailure))
        }
        if (meditationCategoryObj.image) meditationCategoryObj.image = getImageUrl(meditationCategoryObj.image, `${awsBucket.meditationDirectory}/category`);
        res.status(200).send({
            message: meditationCategoryControllerResponse.fetchAllMeditationCategorySuccess,
            data: meditationCategoryObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all meditation categories */
const getAllMeditationCategories = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: FilterQuery<IMeditationCategory> = {}

        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                    { category: await getSearchRegexp(params.search) },
                    { status: await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const meditationSorting = ['title', 'status', 'category', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['createdAt', 'desc']];

        const getMeditationsList = await meditationCategoryService.getAllMeditationCategories(Number(skip), Number(limit), searchFilter, meditationSorting)
        response.status(200).json({ message: meditationCategoryControllerResponse.fetchAllMeditationCategorySuccess, data: getMeditationsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

const getAllMeditationCategoriesList =  async (request: Request, response: Response, next: NextFunction) => {
    try {
        const result: any = await meditationCategoryService.getAllMeditationCategoriesList()
        response.status(200).json({ message: meditationCategoryControllerResponse.fetchAllMeditationCategorySuccess, data: result })
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Update meditation category */
const updateMeditationCategory = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        /** Get faq from db */
        const meditationCategoryObj: any = await meditationCategoryService.getOneMeditationCategoryByFilter({ _id: id })
        if (!meditationCategoryObj) {
            return next(Boom.notFound(meditationCategoryControllerResponse.getMeditationCategoryFailure))
        }

        if (req.body.image === null) await removeS3File(meditationCategoryObj.image, s3Bucket)

        if (req.body.image && req.body.image.includes('base64')) {
            await removeS3File(meditationCategoryObj.image, s3Bucket)
            const s3File: any = await uploadFileToS3(req.body.image, meditationCategoryObj.title, s3Bucket)
            req.body.image = s3File.name
        }
        if (req.body.image && req.body.image.startsWith('http')) {
            req.body.image = meditationCategoryObj.image
        }

        const updatedMeditation = {
            ...req.body,
            image: req.body.image,
        };
        const data = await meditationCategoryService.updateMeditationCategory(updatedMeditation, id)
        return res.status(200).send({ message: meditationCategoryControllerResponse.updateMeditationCategorySuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove meditation category */
const deleteMeditationCategory = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        const meditation = await meditationService.getOneMeditationByFilter({ category: id })
        if (meditation) return next(Boom.badData(meditationCategoryControllerResponse.deleteMeditationCategoryLinkError))

        const meditationCategoryObj = await meditationCategoryService.getOneMeditationCategoryByFilter({ _id: id });

        if (meditationCategoryObj) {
            if (meditationCategoryObj.image) await removeS3File(meditationCategoryObj.image, s3Bucket);
        }
        await meditationCategoryService.deleteMeditationCategory(id)
        return res.status(200).send({ message: meditationCategoryControllerResponse.deleteMeditationCategorySuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addMeditationCategory, getOneMeditationCategory, getAllMeditationCategories, getAllMeditationCategoriesList, updateMeditationCategory, deleteMeditationCategory }
