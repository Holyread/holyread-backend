import { CmsModel } from '../../../models/index'

/** Create Cms */
const createCms = async (body: any) => {
      try {
            let result: any = await CmsModel.create(body)
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Modify Cms */
const updateCms = async (body: any, id: string) => {
      try {
            const updatedCms: any = await CmsModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            return updatedCms
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one Cms by filter */
const getOneCmsByFilter = async (query: any) => {
      try {
            const result: any = await CmsModel.findOne(query).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Cms for table */
const getAllCms = async (skip: number, limit, search: object, sort) => {
      try {
            const CmssList: any = await CmsModel.find(search).skip(skip).limit(limit).sort(sort).lean()
            const count = await CmsModel.find(search).count()
            return { count, cmsList: CmssList }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove Cms */
const deleteCms = async (id: string) => {
      try {
            await CmsModel.findOneAndDelete({ _id: id })
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createCms,
      updateCms,
      getOneCmsByFilter,
      getAllCms,
      deleteCms
}
