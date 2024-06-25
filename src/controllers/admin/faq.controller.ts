import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import faqService from '../../services/admin/faq/faq.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'

const FaqControllerResponse = responseMessage.FaqControllerResponse

/** Add Faq */
const addFaq = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const data = await faqService.createFaq(body)
        res.status(200).send({
            message: FaqControllerResponse.createFaqSuccess,
            data,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one faq by id */
const getOneFaq = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get faq from db */
        const faqObj: any = await faqService.getOneFaqByFilter({ _id: id })
        if (!faqObj) {
            return next(Boom.notFound(FaqControllerResponse.getFaqFailure))
        }
        res.status(200).send({
            message: FaqControllerResponse.fetchFaqSuccess,
            data: faqObj,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all Faqs */
const getAllFaqs = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}

        if (params.search) {
            searchFilter = {
                $or: [
                    { question: await getSearchRegexp(params.search) },
                    { answer: await getSearchRegexp(params.search) },
                    { status: await getSearchRegexp(params.search) },
                ],
            }
        }

        const sortingColumn = params.column as string;
        const sortingOrder = params.order || 'asc';
        const faqsSorting = ['question', 'answer', 'status', 'createdAt'].includes(sortingColumn)
            ? [[sortingColumn, sortingOrder]]
            : [['createdAt', 'desc']];

        const getFaqsList = await faqService.getAllFaqs(Number(skip), Number(limit), searchFilter, faqsSorting)
        response.status(200).json({ message: FaqControllerResponse.fetchAllFaqSuccess, data: getFaqsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update Faq */
const updateFaq = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get faq from db */
        const faqObj: any = await faqService.getOneFaqByFilter({ _id: id })
        if (!faqObj) {
            return next(Boom.notFound(FaqControllerResponse.getFaqFailure))
        }
        const data = await faqService.updateFaq(req.body, id)
        return res.status(200).send({ message: FaqControllerResponse.updateFaqSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove Faq */
const deleteFaq = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        await faqService.deleteFaq(id)
        return res.status(200).send({ message: FaqControllerResponse.deleteFaqSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addFaq, getOneFaq, getAllFaqs, updateFaq, deleteFaq }
