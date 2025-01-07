import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import cronScheduleService from '../../services/admin/cronSchedule/cronSchedule.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'
import { FilterQuery } from 'mongoose';
import { ICronSchedule } from '../../models/cronSchedule.model';

const cronScheduleControllerResponse = responseMessage.cronScheduleControllerResponse

/** Add cron schedule */
const addCronSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body

        body.cronExpression = body.schedule.Minutes + ' ' + body.schedule.Hours + ' ' + body.schedule.DayOfMonth + ' ' + body.schedule.Months + ' ' + body.schedule.DayOfWeek

        const bodyData = {
            ...body,
            cronExpression: body.cronExpression
        }

        const data = await cronScheduleService.createCronSchedule(bodyData)
        res.status(200).send({
            message: cronScheduleControllerResponse.createCronScheduleSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one cron schedule by id */
const getOneCronSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get cron schedule from db */
        const cronScheduleObj: any = await cronScheduleService.getOneCronScheduleByFilter({ _id: id })
        if (!cronScheduleObj) return next(Boom.notFound(cronScheduleControllerResponse.getCronScheduleFailure))
        res.status(200).send({
            message: cronScheduleControllerResponse.fetchCronScheduleSuccess,
            data: cronScheduleObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all cron schedule */
const getAllCronSchedule = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter: FilterQuery<ICronSchedule> = {}

        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const cronScheduleSorting = ['jobName', 'description', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['createdAt', 'desc']];

        const getAllCmsList = await cronScheduleService.getAllCronSchedule(Number(skip), Number(limit), searchFilter, cronScheduleSorting)
        response.status(200).json({ message: cronScheduleControllerResponse.fetchAllCronScheduleSuccess, data: getAllCmsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update cron schedule */
const updateCronSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: any = req.params.id
        /** Get cron schedule from db */
        const cronScheduleObj: any = await cronScheduleService.getOneCronScheduleByFilter({ _id: id })
        if (!cronScheduleObj) return next(Boom.notFound(cronScheduleControllerResponse.getCronScheduleFailure))

        if (req.body.schedule) {
            req.body.cronExpression = req.body.schedule.Minutes + ' ' + req.body.schedule.Hours + ' ' + req.body.schedule.DayOfMonth + ' ' + req.body.schedule.Months + ' ' + req.body.schedule.DayOfWeek
        }

        const bodyData = {
            ...req.body,
            cronExpression: req.body.cronExpression
        }
        const data = await cronScheduleService.updateCronSchedule(bodyData, id)
        return res.status(200).send({ message: cronScheduleControllerResponse.updateCronScheduleSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove cron schedule */
const deleteCronSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id: string = req.params.id
        await cronScheduleService.deleteCronSchedule(id)
        return res.status(200).send({ message: cronScheduleControllerResponse.deleteCronScheduleSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addCronSchedule, getOneCronSchedule, getAllCronSchedule, updateCronSchedule, deleteCronSchedule }
