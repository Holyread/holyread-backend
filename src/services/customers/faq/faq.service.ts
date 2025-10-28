import { FaqModel } from '../../../models/index'
import { Types } from 'mongoose';

/** Get all Faqs for table */
const getAllFaqs = async (languageId: Types.ObjectId) => {
      try {
            const faqsList: any = await FaqModel.find({
              status: "Active",
              language: languageId,
            })
              .lean()
              .exec();
            return faqsList;
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllFaqs,
}
