import feedBackService from "../../services/customers/feedBack/feedBack.service";
import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';
import { responseMessage } from "../../constants/message.constant";

const { authControllerResponse } = responseMessage

const submitFeedback = async (
    req: Request | any,
    res: Response,
    next: NextFunction
) => {
    try {
        const userObj = Object.assign({}, req.user)
        const {
            experienceRating,
            likedFeature,
            comment,
            improvementSuggestions
        }: {
            experienceRating: string,
            likedFeature: string,
            comment?: string
            improvementSuggestions?: string,
        } = req.body;
        await feedBackService.addFeedback({
            experienceRating,
            likedFeature,
            comment,
            improvementSuggestions,
            userId: userObj._id,
        })  
        res.status(200).send({
            message: authControllerResponse.submitFeedbackSuccess,
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { submitFeedback }
