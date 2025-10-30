import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import testimonialService from '../../services/admin/testimonial/testimonial.service'
import { responseMessage } from '../../constants/message.constant'

const testimonialControllerResponse = responseMessage.testimonialControllerResponse

/** Get all testimonial by filter */
const getAllTestimonial = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const language = (request as any).languageId;
        const data = await testimonialService.getAllTestimonials(0, 0, {}, [], language)
        response.status(200).json({ message: testimonialControllerResponse.fetchTestimonialSuccess, data: data.testimonials })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getAllTestimonial }
