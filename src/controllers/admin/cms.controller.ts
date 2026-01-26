import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import cmsService from '../../services/admin/cms/cms.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'
import { FilterQuery } from 'mongoose';
import { ICms } from '../../models/cms.model';

const cmsControllerResponse = responseMessage.cmsControllerResponse

/** Add csm */
const addCms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const language = (req as any).languageId
        const cmsObj: any = await cmsService.getOneCmsByFilter({ title: body.title, language })
        if (cmsObj) return next(Boom.conflict(cmsControllerResponse.createCmsFailure))

        const data = await cmsService.createCms({...body, language})
        res.status(200).send({
            message: cmsControllerResponse.createCmsSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one cms by id */
const getOneCms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const language = (req as any).languageId
        /** Get cms from db */
        const cmsObj: any = await cmsService.getOneCmsByFilter({ _id: id, language })
        if (!cmsObj) return next(Boom.notFound(cmsControllerResponse.getCmsFailure))
        res.status(200).send({
            message: cmsControllerResponse.fetchCmsSuccess,
            data: cmsObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all cms */
const getAllCms = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const language = (request as any).languageId
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: FilterQuery<ICms> = {}

        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                    { metaTitle: await getSearchRegexp(params.search) },
                    { metaKeyword: await getSearchRegexp(params.search) },
                    { metaDescription: await getSearchRegexp(params.search) },
                    { content: await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const cmsSorting = ['title', 'metaTitle', 'metaKeyword', 'metaDescription', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['title', 'desc']];

        const getAllCmsList = await cmsService.getAllCms(Number(skip), Number(limit), searchFilter, cmsSorting, language)
        response.status(200).json({ message: cmsControllerResponse.fetchAllCmsSuccess, data: getAllCmsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update cms */
const updateCms = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        const language = (req as any).languageId
        /** Get cms from db */
        const cmsObj: any = await cmsService.getOneCmsByFilter({ _id: id, language})
        if (!cmsObj) return next(Boom.notFound(cmsControllerResponse.getCmsFailure))

        const data = await cmsService.updateCms({...req.body, language}, id)
        return res.status(200).send({ message: cmsControllerResponse.updateCmsSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove cms */
const deleteCms = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: string = req.params.id as string
        await cmsService.deleteCms(id)
        return res.status(200).send({ message: cmsControllerResponse.deleteCmsSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addCms, getOneCms, getAllCms, updateCms, deleteCms }
