import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import cmsService from '../../services/admin/cms/cms.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'

const cmsControllerResponse = responseMessage.cmsControllerResponse

/** Add csm */
const addCms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const cmsObj: any = await cmsService.getOneCmsByFilter({ title: body.title })
        if (cmsObj) return next(Boom.conflict(cmsControllerResponse.createCmsFailure))

        const data = await cmsService.createCms(body)
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
        /** Get cms from db */
        const cmsObj: any = await cmsService.getOneCmsByFilter({ _id: id })
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
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}

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

        const getAllCmsList = await cmsService.getAllCms(Number(skip), Number(limit), searchFilter, cmsSorting)
        response.status(200).json({ message: cmsControllerResponse.fetchAllCmsSuccess, data: getAllCmsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update cms */
const updateCms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get cms from db */
        const cmsObj: any = await cmsService.getOneCmsByFilter({ _id: id })
        if (!cmsObj) return next(Boom.notFound(cmsControllerResponse.getCmsFailure))

        const data = await cmsService.updateCms(req.body, id)
        return res.status(200).send({ message: cmsControllerResponse.updateCmsSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove cms */
const deleteCms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        await cmsService.deleteCms(id)
        return res.status(200).send({ message: cmsControllerResponse.deleteCmsSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addCms, getOneCms, getAllCms, updateCms, deleteCms }
