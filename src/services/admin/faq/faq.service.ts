import { FaqModel } from '../../../models/index'

/** Create Faq */
const createFaq = async (body: any) => {
      try {
            body.status = 'Active'
            const result: any = await FaqModel.create(body)
            result.status === 'Active' ? result.status = true : result.status = false
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Modify Faq */
const updateFaq = async (body: any, id: string) => {
      try {
            if (body.status === true) body.status = 'Active'
            if (body.status === false) body.status = 'Deactive'
            const result: any = await FaqModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean()
            result.status === 'Active' ? result.status = true : result.status = false
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one Faq by filter */
const getOneFaqByFilter = async (query: any) => {
      try {
            const result: any = await FaqModel.findOne(query).lean()
            if (result) {
                  result.status === 'Active' ? result.status = true : result.status = false
            }
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Faqs for table */
const getAllFaqs = async (skip: number, limit, search: object, sort) => {
      try {
            const faqsList: any = await FaqModel.find(search).skip(skip).limit(limit).sort(sort).lean()
            faqsList.forEach(item => {
                  item.status === 'Active' ? item.status = true : item.status = false
            })
            const count = await FaqModel.find(search).countDocuments()
            return { count, faqs: faqsList }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove Faq */
const deleteFaq = async (id: string) => {
      try {
            await FaqModel.findOneAndDelete({ _id: id })
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createFaq,
      updateFaq,
      getOneFaqByFilter,
      getAllFaqs,
      deleteFaq,
}
