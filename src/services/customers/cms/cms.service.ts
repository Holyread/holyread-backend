import { CmsModel } from '../../../models/index'
import { Types } from 'mongoose'

/** Get all Cms for table */
const getAllCms = async (language: Types.ObjectId) => {
      try {
            const CmssList: any = await CmsModel.find({ language }).lean().exec()
            return CmssList
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllCms,
}
