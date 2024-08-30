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
            likedFeatures,
            comment,
        }: {
            experienceRating: string,
            likedFeatures: string[],
            comment?: string
        } = req.body;
        await feedBackService.addFeedback({
            experienceRating,
            likedFeatures,
            comment,
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
