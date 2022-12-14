import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import { getSearchRegexp } from '../../lib/utils/utils'
import { dataTable } from '../../constants/app.constant'
import { responseMessage } from '../../constants/message.constant'
import stripeSubscriptionService from '../../services/stripe/subscription'
import coupoonsService from '../../services/admin/subscriptions/coupon.service'

const couponsControllerResponse = responseMessage.couponsControllerResponse

/** Add Coupon */
const addCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body

        const couponDetails
            = await stripeSubscriptionService
                .createCoupon({
                    duration: body.duration || 'once',
                    expireDate: new Date(body.expireDate),
                    percentOff: Number(body.discount || 0),
                    durationInMonths: Number(body.durationInMonths || 1)
                });

        if (!couponDetails?.id) {
            return next(
                Boom.notFound(
                    couponsControllerResponse.couponCreateError
                )
            )
        }

        const data = await coupoonsService.createCoupon({
            ...couponDetails
        })

        if (!data._id) {
            return next(
                Boom.notFound(
                    couponsControllerResponse.couponCreateError
                )
            )
        }

        res.status(200).send({
            data,
            message: couponsControllerResponse.createCouponSuccess,
        })

    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

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

        const couponsSorting = [];
        switch (params.column) {
            case 'code':
                couponsSorting.push(['code', params.order || 'ASC']);
                break;
            case 'discount':
                couponsSorting.push(['discount', params.order || 'ASC']);
                break;
            case 'duration':
                couponsSorting.push(['duration', params.order || 'ASC']);
                break;
            case 'durationInMonths':
                couponsSorting.push(['durationInMonths', params.order || 'ASC']);
                break;
            case 'expireDate':
                couponsSorting.push(['expireDate', params.order || 'ASC']);
                break;
            case 'createdAt':
                couponsSorting.push(['createdAt', params.order || 'ASC']);
                break;
            default:
                couponsSorting.push(['expireDate', 'ASC']);
                break;
        }

        const data
            = await coupoonsService
                .getAllCoupons(
                    Number(skip),
                    Number(limit),
                    searchFilter,
                    couponsSorting
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

/** Remove Coupon */
const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id: any = req.params.id
        /** Get coupon from db */
        const data: any = await coupoonsService.getOneCouponByFilter({ _id: id });

        if (!data) {
            return next(Boom.notFound(couponsControllerResponse.getCouponFailure))
        }
        await Promise.all([
            coupoonsService.deleteCoupon(id),
            stripeSubscriptionService.deleteCoupon(data.code)
        ])
        return res
            .status(200)
            .send({
                message: couponsControllerResponse.deleteCouponSuccess
            })

    } catch (e: any) {
        return next(Boom.badData(e.message))
    }
}

export {
    addCoupon,
    getOneCoupon,
    deleteCoupon,
    getAllCoupons,
}
