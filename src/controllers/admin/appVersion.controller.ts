import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import appVersionService from '../../services/admin/appVersion/appVersion.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'
import { FilterQuery } from 'mongoose';
import { IAppVersion } from '../../models/appVersion.model';

const appVersionControllerResponse = responseMessage.appVersionControllerResponse

/** Add appVersion */
const addAppVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body

        const data = await appVersionService.createAppVersion(body)
        res.status(200).send({
            message: appVersionControllerResponse.createAppVersionSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one appVersion by id */
const getOneAppVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get appVersion from db */
        const appVersionObj: any = await appVersionService.getOneAppVersionByFilter({ _id: id })
        if (!appVersionObj) return next(Boom.notFound(appVersionControllerResponse.getAppVersionFailure))
        res.status(200).send({
            message: appVersionControllerResponse.fetchAppVersionSuccess,
            data: appVersionObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all appVersion */
const getAllAppVersion = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: FilterQuery<IAppVersion> = {}

        if (params.search) {
            searchFilter = {
                $or: [
                    { platform: await getSearchRegexp(params.search) },
                    { version: await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const appVersionSorting = ['platform', 'version', 'releaseNotes', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['createdAt', 'desc']];

        const getAllAppVersionList = await appVersionService.getAllAppVersion(Number(skip), Number(limit), searchFilter, appVersionSorting)
        response.status(200).json({ message: appVersionControllerResponse.fetchAppVersionSuccess, data: getAllAppVersionList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update appVersion */
const updateAppVersion = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        /** Get appVersion from db */
        const appVersionObj: any = await appVersionService.getOneAppVersionByFilter({ _id: id })
        if (!appVersionObj) return next(Boom.notFound(appVersionControllerResponse.getAppVersionFailure))

        const data = await appVersionService.updateAppVersion(req.body, id)
        return res.status(200).send({ message: appVersionControllerResponse.updateAppVersionSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove appVersion */
const deleteAppVersion = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: string = req.params.id
        await appVersionService.deleteAppVersion(id)
        return res.status(200).send({ message: appVersionControllerResponse.deleteAppVersionSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addAppVersion, getOneAppVersion, getAllAppVersion, updateAppVersion, deleteAppVersion }
