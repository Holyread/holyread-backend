import { FilterQuery, Types } from 'mongoose';
import { IFaq } from '../../../models/faq.model';
import { FaqModel } from '../../../models/index'

/** Create Faq */
const createFaq = async (body: any) => {
      try {
            body.status = 'Active'
            const result: any = await FaqModel.create(body)
            result.status = result.status === 'Active';
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

const updateFaq = async (body: any, id: string) => {
      try {
            body.status = body.status ? 'Active' : 'Deactive';

            const result: any = await FaqModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean();

            result.status = result.status === 'Active';
            return result;
      } catch (e: any) {
            throw new Error(e.message);
      }
}


/** Get one Faq by filter */
const getOneFaqByFilter = async (query: any) => {
      try {
            const result: any = await FaqModel.findOne(query).lean()
            if (result) result.status = result.status === 'Active';
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all Faqs for table */
const getAllFaqs = async (skip: number, limit, search: FilterQuery<IFaq>, sort, language?: Types.ObjectId) => {
      try {
            const query = { ...search };
            if (language) {
                  query.language = language;
            }
            const faqsList: any = await FaqModel.find(query).skip(skip).limit(limit).sort(sort).lean()
            faqsList.forEach(item => {
                  item.status = item.status === 'Active';
            })
            const count = await FaqModel.find(query).countDocuments()
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
