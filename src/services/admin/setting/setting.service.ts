import { SettingModel } from '../../../models/index'

/** Modify Setting */
const updateSetting = async (body: any) => {
      try {
            const updatedSetting: any = await SettingModel.findOneAndUpdate(
                  {},
                  { ...body, updatedAt: new Date() },
                  { new: true, upsert: true }
            ).lean()
            return updatedSetting
      } catch (e: any) {
            throw new Error(e)
      }
}

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
      updateSetting,
      getSetting
}
