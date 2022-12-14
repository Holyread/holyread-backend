import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'
import { responseMessage } from '../../constants/message.constant'
import stripeSubscriptionService from '../../services/stripe/subscription'
import coupoonsService from '../../services/customers/subscriptions/coupon.service'

const couponsControllerResponse = responseMessage.couponsControllerResponse

/**  Get one coupon by id */
const getOneCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id

        /** Get coupon from db */
        const data: any = await coupoonsService.getOneCouponByFilter({ _id: id });

        if (!data) {
            return next(Boom.notFound(couponsControllerResponse.getCouponFailure))
        }

        const couponDetails = await stripeSubscriptionService.getOneCoupon(data.code);
        if (!couponDetails) {
            return next(Boom.notFound(couponsControllerResponse.getCouponFailure))
        }

        data.valid = couponDetails.valid

        res.status(200).send({
            data,
            message: couponsControllerResponse.fetchCouponSuccess,
        })

    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

/** Get all Coupons */
const getAllCoupons = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const params = request.query
        const skip: any = params.skip ? params.skip : dataTable.skip
        const limit: any = params.limit ? params.limit : dataTable.limit

        let searchFilter = {}
        if (params.search) {
            searchFilter = {
                $or: [
                    { code: await getSearchRegexp(params.search) },
                    { duration: await getSearchRegexp(params.search) },
                ]
            }
        }
        if (
            params.search &&
            (Number(params.search) || Number(params.search) == 0)
        ) {
            searchFilter['$or'] = [
                ...searchFilter['$or'],
                { discount: params.search },
                { durationInMonths: params.search }
            ]
        }

        const data
            = await coupoonsService
                .getAllCoupons(
                    Number(skip),
                    Number(limit),
                    searchFilter,
                    []
                )

        response
            .status(200)
            .json({
                data,
                message: couponsControllerResponse.fetchCouponsSuccess,
            })

    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export {
    getOneCoupon,
    getAllCoupons,
}
