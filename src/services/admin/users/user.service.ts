import config from '../../../../config'
import { encrypt, formattedDate } from '../../../lib/utils/utils'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
// import { UserModel, SubscriptionsModel } from '../../../models/index'
import { UserLibraryModel, UserModel } from '../../../models/index'
import { FilterQuery, Types } from 'mongoose'
import { IUserLibrary } from '../../../models/userLibrary.model'
import { IUser } from '../../../models/user.model'
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
const updateUser = async (query: FilterQuery<IUser>, body: any) => {
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
const getOneUserByFilter = async (query: any, select = []) => {
  try {
    const result: any = await UserModel.findOne(query)
      .select(select)
      .populate({
        path: 'subscription',
        select: 'title',
      })
      .lean()
      .exec();
    return result;
  } catch (e: any) {
    throw new Error(e);
  }
};

/** Get all Users for table */
const getAllUsers = async (
    skip: number,
    limit: number,
    search: any,
    sort: Record<string, any>,
    language?: Types.ObjectId
) => {
    try {
        const page: any = [
            { $skip: skip },
        ];
        if (limit) {
            page.push({ $limit: limit });
        }
        const query = { ...search };
        if (language) {
            query.language = language;
        }

        const result: any = await UserModel.aggregate([
            {
                $match: query,
            },
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
                    isSignedUp: 1.0,
                    timeZone: 1.0,
                    country: 1.0,
                    isAppUninstalled : 1.0,
                    image: {
                        $concat: [
                            awsBucket[NODE_ENV].s3BaseURL + '/users/',
                            '$image',
                        ],
                    },
                    inAppSubscriptionStatus: 1.0,
                    'inAppSubscription.createdAt': 1.0,
                    'inAppSubscription.expiredAt': 1.0,
                    'inAppSubscription.coupon': 1.0,
                    'inAppSubscription.purchaseToken': 1.0,
                },
            },
            {
                $lookup: {
                    as: 'subscription',
                    foreignField: '_id',
                    from: 'subscriptions',
                    localField: 'subscription',
                },
            },
            {
                $lookup: {
                    as: 'transaction',
                    foreignField: '_id',
                    from: 'transactions',
                    localField: 'lastTrnId',
                },
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
                },
            },
            {
                $sort: sort,
            },
            {
                $facet: {
                    page,
                    total: [
                        {
                            $count: 'count',
                        },
                    ],
                },
            },
        ], {
            allowDiskUse: true // Enable external sorting
        }).exec();

        const users = result[0]?.page;

        return { count: result[0]?.total[0]?.count || 0, users };
    } catch (e: any) {
        throw new Error(e);
    }
};


/** Remove User */
const deleteUser = async (query: FilterQuery<IUser>) => {
    try {
        await UserModel.findOneAndDelete(query)
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Users for dashboard */
const getAllUsersForDashboard = async (query: any, language: Types.ObjectId) => {
    try {
        const pipeline = [
            { $match: { ...query, language } },
            {
                $group: {
                    _id: '$device',
                    count: { $sum: 1 }
                }
            }
        ];
        const usersAggregation: any = await UserModel.aggregate(pipeline).exec();
        return usersAggregation;
    } catch (e: any) {
        throw new Error(e);
    }
};

const getAllUsersForExport = async (language: Types.ObjectId) => {
    try {
        const users: any = await UserModel.find({ language }).select('firstName lastName email status image type isSignedUp device country timeZone createdAt').lean().exec()
        return users
    } catch (e: any) {
        throw new Error(e)
    }
}

const getUseForCustomNotification = async (query: any, select: string) => {
    try {
        const users: any = await UserModel.find(query).select(select || '').lean().exec()
        return users
    } catch (e: any) {
        throw new Error(e)
    }
}

const PAGE_SIZE = 1000;

const getAllExportUsers = async (search) => {
    try {
        let results = [];
        let page = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const userChunk : any = await UserModel.aggregate([
                {
                    $match: search,
                },
                { $skip: page * PAGE_SIZE },
                { $limit: PAGE_SIZE },
                {
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        email: 1,
                        stripe: 1,
                        status: 1,
                        device: 1,
                        lastTrnId: 1,
                        createdAt: 1,
                        subscription: 1,
                        isSignedUp: 1,
                        inAppSubscriptionStatus: 1,
                        country: 1,
                        timeZone: 1,
                        isAppUninstalled : 1.0,
                        'inAppSubscription.createdAt': 1,
                        'inAppSubscription.expiredAt': 1,
                        'inAppSubscription.coupon': 1,
                        'inAppSubscription.purchaseToken': 1,
                    },
                },
                {
                    $lookup: {
                        as: 'subscription',
                        foreignField: '_id',
                        from: 'subscriptions',
                        localField: 'subscription',
                    },
                },
                {
                    $lookup: {
                        as: 'transaction',
                        foreignField: '_id',
                        from: 'transactions',
                        localField: 'lastTrnId',
                    },
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
                    },
                },
            ]);

            if (userChunk.length === 0) {
                hasMoreData = false;
            } else {
                results = results.concat(userChunk);
                page++;
            }
        }

        await Promise.all(results.map(async (i: any) => {
            i.createdAt = i?.createdAt && formattedDate(i?.createdAt)?.replace(/ /g, ' ');
            i.coupon = i?.stripe?.coupon || i?.inAppSubscription?.coupon || '';
            i.total = i.transaction?.amount?.total;
            i.subscription = i.subscription[0]?.title;

            if (i.transaction) {
                i.paymentmethod = i.transaction?.device === 'web'
                    ? i.transaction?.paymentMethod?.brand
                    : i?.inAppSubscription?.purchaseToken
                        ? 'In-App (Android)'
                        : 'In-App (iOS)';
            }

            if (!i.stripe && !i.inAppSubscription) {
                i.subscriptionStatus = 'Freemium';
            }

            if (!i.subscriptionStatus && i.inAppSubscriptionStatus && ['android', 'ios'].includes(i.device)) {
                i.subscriptionStatus = i.inAppSubscriptionStatus === 'Active'
                    ? (i.stripe?.coupon ? 'Coupon' : 'Activated')
                    : 'Cancelled';
            }

            if (!i.subscriptionStatus && i?.stripe?.subscriptionId) {
                if (!i.stripe?.status) {
                    i.subscriptionStatus = 'Freemium';
                } else if (['trialing', 'incomplete'].includes(i.stripe?.status)) {
                    i.subscriptionStatus = 'Freemium';
                } else if (i.stripe?.status === 'active') {
                    i.subscriptionStatus = 'Activated';
                } else if (i.stripe?.status === 'canceled') {
                    i.subscriptionStatus = 'Cancelled';
                } else if (['past_due', 'unpaid', 'incomplete_expired'].includes(i.stripe?.status)) {
                    i.subscriptionStatus = 'Freemium';
                } else {
                    i.subscriptionStatus = 'Freemium';
                }
            }

            if (!i.subscriptionStatus) {
                i.subscriptionStatus = 'Freemium';
            }

            if (i.stripe?.status === 'active' && i.stripe?.coupon) {
                i.subscriptionStatus = 'Coupon';
            }
        }));

        return results;
    } catch (e: any) {
        throw new Error(e);
    }
};

const getCountries = async () => {
    try {
        const users: any = await UserModel.find({ country: { $exists: true } }).select('country _id').lean().exec();
        const countries = [...new Set(users.map(user => user.country))]
        return countries
    } catch (e: any) {
        throw new Error(e)
    }
};

const getTimeZones = async () => {
    try {
        const users: any = await UserModel.find({ timeZone: { $exists: true } }).select('timeZone _id').lean().exec();
        const timeZones = [...new Set(users.map(user => user.timeZone))]
        return timeZones
    } catch (e: any) {
        throw new Error(e)
    }
};

/** Remove UserLibrary */
const deleteUserLibrary = async (query: FilterQuery<IUserLibrary>) => {
    try {
        await UserLibraryModel.findOneAndDelete(query)
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createUser,
    updateUser,
    getOneUserByFilter,
    getAllUsers,
    deleteUser,
    getAllUsersForDashboard,
    getAllUsersForExport,
    getUseForCustomNotification,
    getAllExportUsers,
    getCountries,
    getTimeZones,
    deleteUserLibrary
};
