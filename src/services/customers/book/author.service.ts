import { BookAuthorModel } from '../../../models/index'
import { Types } from 'mongoose'
/** Get all author options list */
const getAllAuthorsOptionsList = async (language: Types.ObjectId) => {
      try {
            const authorsOptionsList = await BookAuthorModel.find({language}).select('name').sort([['name', 'asc']])
            return authorsOptionsList
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get author */
const findAuthor = async (query: any) => {
      try {
            const data: any = await BookAuthorModel.findOne(query).lean().exec()
            return data
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllAuthorsOptionsList,
      findAuthor,
}
