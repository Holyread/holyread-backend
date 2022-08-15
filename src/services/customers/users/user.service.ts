import { encrypt } from '../../../lib/utils/utils'
import { UserModel, NotificationsModel } from '../../../models/index'

/** Modify User */
const updateUser = async (body: any, query: object) => {
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
const getOneUserByFilter = async (query: any) => {
    try {
        const result: any = await UserModel.findOne(query).select('-password').lean().exec()
        if (result) {
            const notifications = await NotificationsModel.find({ userId: result._id }).sort([['createdAt', 'DESC']]).lean().exec()
            result.notifications = notifications    
        }
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all Users */
const getAllUsers = async (search: object) => {
    try {
        const users = await UserModel.find({ ...search, type: 'User' }).lean()
        return users
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

export default { updateUser, getOneUserByFilter, getAllUsers, deleteUser }
