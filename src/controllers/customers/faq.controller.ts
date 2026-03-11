import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import faqService from '../../services/customers/faq/faq.service'
import { responseMessage } from '../../constants/message.constant'

const FaqControllerResponse = responseMessage.FaqControllerResponse

/** Get all Faqs */
const getAllFaqs = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { language } = (request as any)?.user

        const getFaqsList = await faqService.getAllFaqs(language)
        response.status(200).json({ message: FaqControllerResponse.fetchAllFaqSuccess, data: getFaqsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllFaqs }
