import { CouponsModel } from '../../../models/index';

/** Get one Coupon by filter */
const getOneCouponByFilter = async (query: any) => {
      try {

            const result: any
                  = await CouponsModel
                        .findOne(
                              query
                        ).select([
                              'code',
                              'discount',
                              'duration',
                              'expireDate',
                              'maxRedemptions',
                              'type'
                        ])
                        .lean();
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all coupons */
const getAllCoupons = async (skip: number, limit, search: object, sort) => {
      try {
            const coupons: any
                  = await CouponsModel
                        .find(search)
                        .select([
                              'code',
                              'discount',
                              'duration',
                              'expireDate',
                              'maxRedemptions',
                        ])
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

export default {
      getAllCoupons,
      getOneCouponByFilter,
}
