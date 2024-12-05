import { AppVersionModel } from "../../../models"

const getOneAppVersionByFilter = async (query: any) => {
    try {
        const result: any = await AppVersionModel.findOne(query).sort({ createdAt: -1 }).lean()
        return result
    } catch (e: any) {
        throw new Error(e)
    }
}

export default { getOneAppVersionByFilter }
