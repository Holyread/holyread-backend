import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import subscriptionsService from '../../services/subscriptions/subscriptions.service'
import usersService from '../../services/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'

const subscriptionsControllerResponse = responseMessage.subscriptionsControllerResponse

/** Add Subscription */
const addSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body
        const subscriptionObj: any = await subscriptionsService.getOneSubscriptionByFilter({ title: body.title, price: body.price })
        if (subscriptionObj) {
            return next(Boom.conflict(subscriptionsControllerResponse.createSubscriptionFailure))
        }
        const data = await subscriptionsService.createSubscription(body)
        res.status(200).send({
            message: subscriptionsControllerResponse.createSubscriptionSuccess,
            data
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/**  Get one subscription by id */
const getOneSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get subscription from db */
        const subscriptionObj: any = await subscriptionsService.getOneSubscriptionByFilter({ _id: id })
        if (!subscriptionObj) {
            return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
        }
        res.status(200).send({
            message: subscriptionsControllerResponse.fetchSubscriptionSuccess,
            data: subscriptionObj
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all Subscriptions */
const getAllSubscriptions = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        if (params.names === 'true') {
            const getSubscriptionsList = await subscriptionsService.getAllSubscriptionsName()
            response.status(200).json({ message: subscriptionsControllerResponse.fetchSubscriptionsSuccess, data: getSubscriptionsList })
        }
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) { searchFilter = { 'title': await getSearchRegexp(params.search) } }

        const subscriptionsSorting = [];
        switch (params.column) {
            case 'title':
                subscriptionsSorting.push(['title', params.order || 'ASC']);
                break;
            case 'price':
                subscriptionsSorting.push(['price', params.order || 'ASC']);
                break;
            case 'duration':
                subscriptionsSorting.push(['duration', params.order || 'ASC']);
                break;
            case 'status':
                subscriptionsSorting.push(['status', params.order || 'ASC']);
                break;
            case 'createdAt':
                subscriptionsSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                subscriptionsSorting.push(['title', 'DESC']);
                break;
        }

        const getSubscriptionsList = await subscriptionsService.getAllSubscriptions(Number(skip), Number(limit), searchFilter, subscriptionsSorting)
        response.status(200).json({ message: subscriptionsControllerResponse.fetchSubscriptionsSuccess, data: getSubscriptionsList })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Update Subscription */
const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get subscription from db */
        const subscriptionObj: any = await subscriptionsService.getOneSubscriptionByFilter({ _id: id })
        if (!subscriptionObj) {
            return next(Boom.notFound(subscriptionsControllerResponse.getSubscriptionFailure))
        }
        const data = await subscriptionsService.updateSubscription(req.body, id)
        return res.status(200).send({ message: subscriptionsControllerResponse.updateSubscriptionSuccess, data })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

/** Remove Subscription */
const deleteSubcription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        const subscriptionUser = await usersService.getOneUserByFilter({ subscriptions: id })
        if (subscriptionUser) {
            return next(Boom.locked(subscriptionsControllerResponse.subscriptionIsInUsedError))
        }
        await subscriptionsService.deleteSubscription(id)
        return res.status(200).send({ message: subscriptionsControllerResponse.deleteSubscriptionSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addSubscription, getOneSubscription, getAllSubscriptions, updateSubscription, deleteSubcription }
