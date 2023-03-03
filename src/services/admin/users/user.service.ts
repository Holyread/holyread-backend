import config from '../../../../config'
import { encrypt } from '../../../lib/utils/utils'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
// import { UserModel, SubscriptionsModel } from '../../../models/index'
import { UserModel } from '../../../models/index'
// import stripeSubscriptionService from '../../stripe/subscription'
const NODE_ENV = config.NODE_ENV
const authControllerResponse = responseMessage.authControllerResponse

/** Add User */
const createUser = async (body: any) => {
    try {
        if (body.password) body.password = encrypt(body.password)
        const result = await UserModel.create(body)
        if (!result) {
            throw new Error(authControllerResponse.createUserFailed)
        }
        return { _id: result._id, email: result.email }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify User */
const updateUser = async (query: object, body: any) => {
    try {
        if (body.password) {
            body.password = encrypt(body.password)
        }
        const data: any = await UserModel.findOneAndUpdate(query, { ...body, updatedAt: new Date() }, { new: true })
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get user by id */
const getOneUserByFilter = async (query: any, select=[]) => {
    try {
        const result: any = await UserModel.findOne(query).select(select).lean().exec()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Users for table */
const getAllUsers = async (
    skip: number,
    limit: number,
    search: object,
    sort: object
) => {
    try {
        const page: any = [
            { $skip: skip },
        ]
        if (limit) {
            page.push({ $limit: limit })
        }
        let result: any
            = await UserModel
                .aggregate([
                    {
                        $project: {
                            type: 1.0,
                            email: 1.0,
                            stripe: 1.0,
                            status: 1.0,
                            device: 1.0,
                            lastName: 1.0,
                            lastTrnId: 1.0,
                            firstName: 1.0,
                            createdAt: 1.0,
                            subscription: 1.0,
                            image: {
                                $concat: [
                                    awsBucket[NODE_ENV].s3BaseURL + '/users/',
                                    '$image'
                                ]
                            },
                            inAppSubscriptionStatus: 1.0,
                            'inAppSubscription.createdAt': 1.0,
                            'inAppSubscription.expiredAt': 1.0,
                            'inAppSubscription.coupon': 1.0,
                        }
                    },
                    {
                        $lookup: {
                            as: 'subscription',
                            foreignField: '_id',
                            from: 'subscriptions',
                            localField: 'subscription',
                        }
                    },
                    {
                        $lookup: {
                            as: 'transaction',
                            foreignField: '_id',
                            from: 'transactions',
                            localField: 'lastTrnId',
                        }
                    },
                    {
                        $match: search,
                    },
                    {
                        $project: {
                            'lastTrnId': 0,
                            'subscription.__v': 0,
                            'subscription.saves': 0,
                            'subscription.status': 0,
                            'subscription.duration': 0,
                            'subscription.createdAt': 0,
                            'subscription.updatedAt': 0,
                            'subscription.description': 0,
                            'subscription.stripePlanId': 0,
                            'subscription.intervalCount': 0,
                        }
                    },
                    {
                        $sort: sort
                    },
                    {
                        $facet: {
                            page,
                            total: [
                                {
                                    $count: 'count'
                                }
                            ]
                        }
                    }
                ]);
        const users = result[0]?.page;

        return { count: result[0]?.total[0]?.count || 0, users }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove User */
const deleteUser = async (id: string) => {
    try {
        await UserModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Users for dashboard */
const getAllUsersForDashboard = async (query: any, select: string) => {
    try {
        const users: any = await UserModel.find().select(select || '').lean().exec()
        return users
    } catch (e: any) {
        throw new Error(e)
    }
}

export default { createUser, updateUser, getOneUserByFilter, getAllUsers, deleteUser, getAllUsersForDashboard }
