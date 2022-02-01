import { UserModel, SubscriptionsModel } from '../../models/index'
import { getToken, encrypt } from '../../lib/utils/utils'
import { awsBucket } from '../../constants/app.constant'
import config from '../../../config'
import { responseMessage } from '../../constants/message.constant'
import subscriptionService from '../subscriptions/subscriptions.service'
const NODE_ENV = config.NODE_ENV
const authControllerResponse = responseMessage.authControllerResponse
/** Add User */
const createUser = async (body: any) => {
    try {
        body.password = encrypt(body.password)
        if (!body.subscriptions) {
            const subscriptionDetails = await subscriptionService.getOneSubscriptionByFilter({ title: 'Free-Trial' })
            if (subscriptionDetails) {
                body.subscriptions = subscriptionDetails._id
            }
        }
        const result = await UserModel.create(body)
        if (!result) {
            throw new Error(authControllerResponse.createUserFailed)
        }
        const token: string = getToken({ email: result.email })
        return { _id: result._id, email: result.email, token }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify User */
const updateUser = async (body: any, id: string) => {
    try {
        if (body.password) {
            body.password = encrypt(body.password)
        }
        const data: any = await UserModel.findOneAndUpdate({ _id: id }, { ...body, updatedAt: new Date() }, { new: true })
        return data
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get user by id */
const getOneUserByFilter = async (query: any) => {
    try {
        const result: any = await UserModel.findOne(query).select('-password').lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Users for table */
const getAllUsers = async (skip: number, limit, search: object, sort) => {
    try {
        const users = await UserModel.find({ ...search, type: 'User' }).select('-password').skip(skip).limit(limit).sort(sort).lean()
        const count = await UserModel.find({ ...search, type: 'User' }).count()
        await Promise.all(users.map(async (oneUser: any) => {
            if (!oneUser) {
                return
            }
            if (oneUser.image) {
                oneUser.image = awsBucket[NODE_ENV].s3BaseURL + '/users/' + oneUser.image
            }
            if (!oneUser.subscriptions) {
                return;
            }
            const userSubscriptionDetails = await SubscriptionsModel.findById(oneUser.subscriptions).lean()
            if (!userSubscriptionDetails) {
                return
            }
            oneUser.subscriptions = userSubscriptionDetails.title
        }))
        return { count, users }
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

export default { createUser, updateUser, getOneUserByFilter, getAllUsers, deleteUser }
