import { EmailTemplateModel } from '../../../models/index'

/** Create email template */
const createEmailTemplate = async (body: any) => {
      try {
            const result: any = await EmailTemplateModel.create(body)
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Modify email template */
const updateEmailTemplate = async (body: any, id: string) => {
      try {
            const result: any = await EmailTemplateModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one email template by filter */
const getOneEmailTemplateByFilter = async (query: any) => {
      try {
            const result: any = await EmailTemplateModel.findOne(query).lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all email template for table */
const getAllEmailTemplates = async (skip: number, limit, search: object, sort) => {
      try {
            const emailTemplates: any = await EmailTemplateModel.find(search).skip(skip).limit(limit).sort(sort).lean()
            const count = await EmailTemplateModel.find(search).countDocuments()
            return { count, emailTemplates }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove email template */
const deleteEmailTemplate = async (id: string) => {
      try {
            await EmailTemplateModel.findOneAndDelete({ _id: id })
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createEmailTemplate,
      updateEmailTemplate,
      getOneEmailTemplateByFilter,
      getAllEmailTemplates,
      deleteEmailTemplate,
}
