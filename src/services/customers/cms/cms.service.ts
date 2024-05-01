import { CmsModel } from '../../../models/index'

/** Get all Cms for table */
const getAllCms = async () => {
      try {
            const CmssList: any = await CmsModel.find({}).lean().exec()
            return CmssList
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllCms,
}
