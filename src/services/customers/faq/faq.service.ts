import { FaqModel } from '../../../models/index'

/** Get all Faqs for table */
const getAllFaqs = async () => {
      try {
            const faqsList: any = await FaqModel.find({ status: 'Active' }).lean().exec()
            return faqsList
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllFaqs
}
