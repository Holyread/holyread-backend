import { SettingModel } from '../../../models/index'

/** Get Setting */
const getSetting = async () => {
      try {
            const result: any = await SettingModel.findOne({}).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getSetting
}
