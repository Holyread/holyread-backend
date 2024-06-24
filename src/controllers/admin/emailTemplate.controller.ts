import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import emailTemplateService from '../../services/admin/emailTemplate/emailTemplate.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'

const emailTemplateControllerResponse = responseMessage.emailTemplateControllerResponse

/** Add email template */
const addEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const emailTemplateObj: any = await emailTemplateService.getOneEmailTemplateByFilter({ title: body.title })
        if (emailTemplateObj) return next(Boom.conflict(emailTemplateControllerResponse.createEmailTemplateFailure))

        const data = await emailTemplateService.createEmailTemplate(body)
        res.status(200).send({
            message: emailTemplateControllerResponse.createEmailTemplateSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one email template by id */
const getOneEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get emailTemplate from db */
        const emailTemplateObj: any = await emailTemplateService.getOneEmailTemplateByFilter({ _id: id })
        if (!emailTemplateObj) return next(Boom.notFound(emailTemplateControllerResponse.getEmailTemplateFailure))

        res.status(200).send({
            message: emailTemplateControllerResponse.fetchEmailTemplateSuccess,
            data: emailTemplateObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all email template */
const getAllEmailTemplates = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}

        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                    { subject: await getSearchRegexp(params.search) },
                    { content: await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const emailTemplateSorting = ['title', 'subject', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['title', 'desc']];

        const getAllEmailTemplatesList = await emailTemplateService.getAllEmailTemplates(Number(skip), Number(limit), searchFilter, emailTemplateSorting)
        response.status(200).json({ message: emailTemplateControllerResponse.fetchAllEmailTemplatesSuccess, data: getAllEmailTemplatesList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update email template */
const updateEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get email template from db */
        const emailTemplateObj: any = await emailTemplateService.getOneEmailTemplateByFilter({ _id: id })
        if (!emailTemplateObj) return next(Boom.notFound(emailTemplateControllerResponse.getEmailTemplateFailure))
        const data = await emailTemplateService.updateEmailTemplate(req.body, id)
        return res.status(200).send({ message: emailTemplateControllerResponse.updateEmailTemplateSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove email template */
const deleteEmailTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        await emailTemplateService.deleteEmailTemplate(id)
        return res.status(200).send({ message: emailTemplateControllerResponse.deleteEmailTemplateSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addEmailTemplate, getOneEmailTemplate, getAllEmailTemplates, updateEmailTemplate, deleteEmailTemplate }
