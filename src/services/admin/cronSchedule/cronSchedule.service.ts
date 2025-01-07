import { FilterQuery } from 'mongoose'
import { ICronSchedule } from '../../../models/cronSchedule.model'
import { CronScheduleModel } from '../../../models/index'

/** Create Cron Schedule */
const createCronSchedule = async (body: any) => {
      try {
            const result: any = await CronScheduleModel.create(body)
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Modify Cron Schedule */
const updateCronSchedule = async (body: any, id: string) => {
      try {
            const updatedCms: any = await CronScheduleModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            return updatedCms
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one Cron Schedule by filter */
const getOneCronScheduleByFilter = async (query: any) => {
      try {
            const result: any = await CronScheduleModel.findOne(query).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Cron Schedule for table */
const getAllCronSchedule = async (skip: number, limit, search: FilterQuery<ICronSchedule>, sort) => {
      try {
            const cronList: any = await CronScheduleModel.find(search).skip(skip).limit(limit).sort(sort).lean()
            const count = await CronScheduleModel.find(search).countDocuments()
            return { count, cronScheduleList: cronList }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove Cron Schedule */
const deleteCronSchedule = async (id: string) => {
      try {
            await CronScheduleModel.findOneAndDelete({ _id: id })
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createCronSchedule,
      updateCronSchedule,
      getOneCronScheduleByFilter,
      getAllCronSchedule,
      deleteCronSchedule,
}
