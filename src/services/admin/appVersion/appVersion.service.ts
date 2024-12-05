import { FilterQuery } from 'mongoose'
import { IAppVersion } from '../../../models/appVersion.model'
import { AppVersionModel } from '../../../models/index'

/** Create Cms */
const createAppVersion = async (body: any) => {
    try {
        const result: any = await AppVersionModel.create(body)
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Modify AppVersion */
const updateAppVersion = async (body: any, id: string) => {
    try {
        const updatedAppVersion: any = await AppVersionModel.findOneAndUpdate(
            { _id: id },
            { ...body, updatedAt: new Date() },
            { new: true }
        ).lean()
        return updatedAppVersion
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get one AppVersion by filter */
const getOneAppVersionByFilter = async (query: any) => {
    try {
        const result: any = await AppVersionModel.findOne(query).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Get all AppVersion for table */
const getAllAppVersion = async (skip: number, limit, search: FilterQuery<IAppVersion>, sort) => {
    try {
        const AppVersionList: any = await AppVersionModel.find(search).skip(skip).limit(limit).sort(sort).lean()
        const count = await AppVersionModel.find(search).countDocuments()
        return { count, appVersionList: AppVersionList }
    } catch (e: any) {
        throw new Error(e)
    }
}

/** Remove AppVersion */
const deleteAppVersion = async (id: string) => {
    try {
        await AppVersionModel.findOneAndDelete({ _id: id })
        return true
    } catch (e: any) {
        throw new Error(e)
    }
}

export default {
    createAppVersion,
    updateAppVersion,
    getOneAppVersionByFilter,
    getAllAppVersion,
    deleteAppVersion,
}
