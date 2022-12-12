import { CouponsModel } from '../../../models/index';

/** Create Coupon */
const createCoupon = async (
      body: {
            id: string,
            created: number,
            duration: string,
            redeem_by: number,
            percent_off: number,
            times_redeemed: number,
            duration_in_months: number
      }
) => {
      try {
            let result: any = await CouponsModel.create({
                  code: body.id,
                  duration: body.duration,
                  discount: body.percent_off,
                  redeemCount: body.times_redeemed,
                  createdAt: new Date(body.created * 1000),
                  updatedAt: new Date(body.created * 1000),
                  durationInMonths: body.duration_in_months,
                  expireDate: new Date(body.redeem_by * 1000),
            })
            return result.toJSON()
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one Coupon by filter */
const getOneCouponByFilter = async (query: any) => {
      try {

            const result: any = await CouponsModel.findOne(query).lean();
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Subscriptions for table */
const getAllCoupons = async (skip: number, limit, search: object, sort) => {
      try {
            const coupons: any
                  = await CouponsModel
                        .find(search)
                        .skip(skip)
                        .limit(limit)
                        .sort(sort)
                        .lean();

            const count = await CouponsModel.find(search).count()
            return { count, coupons }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove Coupon */
const deleteCoupon = async (id: string) => {
      try {
            await CouponsModel.findOneAndDelete({ _id: id });
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      deleteCoupon,
      createCoupon,
      getAllCoupons,
      getOneCouponByFilter,
}
