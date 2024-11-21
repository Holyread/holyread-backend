import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import meditationService from '../../services/customers/meditation/meditation.service'
import { responseMessage } from '../../constants/message.constant'

const meditationControllerResponse = responseMessage.meditationControllerResponse
const meditationCategoryControllerResponse = responseMessage.meditationCategoryControllerResponse

/** Get all Faqs */
const getAllMeditations = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        let meditationSearchFilter: any = { status: 'Active' };

        if (params.category) {
            meditationSearchFilter.category = params.category;
        }
        
        if (params.search) {
            meditationSearchFilter.title = params.search;
        }

        const getMeditationsList = await meditationService.getAllMeditations( meditationSearchFilter)
        response.status(200).json({ message: meditationControllerResponse.fetchAllMeditationSuccess, data: getMeditationsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

const getAllMeditationCategoriesList =  async (request: Request, response: Response, next: NextFunction) => {
    try {
        const result: any = await meditationService.getAllMeditationCategoriesList()
        response.status(200).json({ message: meditationCategoryControllerResponse.fetchAllMeditationCategorySuccess, data: result })
    } catch (e: any) {
        throw new Error(e)
    }
}

export { getAllMeditations, getAllMeditationCategoriesList }
