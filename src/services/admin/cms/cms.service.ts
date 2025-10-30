import { FilterQuery, Types } from 'mongoose'
import { ICms } from '../../../models/cms.model'
import { CmsModel } from '../../../models/index'

/** Create Cms */
const createCms = async (body: any) => {
      try {
            const result: any = await CmsModel.create(body)
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
const getAllCms = async (skip: number, limit, search: FilterQuery<ICms>, sort, language?: Types.ObjectId) => {
      try {
            const query = { ...search };
            if (language) {
                  query.language = language;
            }
            const CmssList: any = await CmsModel.find(query).skip(skip).limit(limit).sort(sort).lean()
            const count = await CmsModel.find(query).countDocuments()
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
      deleteCms,
}
