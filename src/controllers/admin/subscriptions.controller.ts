import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import subscriptionsService from '../../services/admin/subscriptions/subscriptions.service'
import stripeService from '../../services/stripe/plan'
import usersService from '../../services/admin/users/user.service'
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
        let intervalCount = 1
        let duration = body.duration
        if (body.duration === 'Half Year') {
            intervalCount = 6
            duration = 'Month'
            body.intervalCount = 6
        }
        const createPlan = await stripeService.createPlan(body.title, Number(body.price), duration, intervalCount)
        if (!createPlan || !createPlan.id) {
            return next(Boom.badData(subscriptionsControllerResponse.planCreateError))
        }
        const data = await subscriptionsService.createSubscription({ ...body, stripePlanId: createPlan.id })
        delete data.stripePlanId
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
        delete subscriptionObj.stripePlanId
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
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { title: await getSearchRegexp(params.search) },
                    { price: params.search },
                    { saves: params.search },
                    { status: await getSearchRegexp(params.search) },
                    { duration: params.search },
                ]
            }
        }
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

/** Get all Subscriptions options list */
const getAllSubscriptionsOptionsList = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const getSubscriptionsList = await subscriptionsService.getAllSubscriptionsName()
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
        if (req.body.price && req.body.price !== subscriptionObj.price) {
            const planDetails = await stripeService.retrievePlan(subscriptionObj.stripePlanId)
            if (!planDetails) {
                return next(Boom.notFound(subscriptionsControllerResponse.planFetchError))
            }
            const createNewPrice = await stripeService.addPrice(planDetails.product, Number(req.body.price), subscriptionObj.duration, subscriptionObj.intervalCount)
            if (!createNewPrice.id) {
                req.body.price = subscriptionObj.price
            }
        }
        const data = await subscriptionsService.updateSubscription(req.body, id)
        delete data.stripePlanId
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
        const subscriptionDetails = await subscriptionsService.getOneSubscriptionByFilter({ _id: id })
        const deletePlan = await stripeService.deletePlanById(subscriptionDetails.stripePlanId)
        if (!deletePlan) {
            return next(Boom.locked(subscriptionsControllerResponse.planDeleteError))
        }
        await subscriptionsService.deleteSubscription(id)
        return res.status(200).send({ message: subscriptionsControllerResponse.deleteSubscriptionSuccess })
    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export { addSubscription, getOneSubscription, getAllSubscriptions, getAllSubscriptionsOptionsList, updateSubscription, deleteSubcription }
