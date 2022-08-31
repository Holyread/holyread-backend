import { BookAuthorModel } from '../../../models/index'

/** Get all author options list */
const getAllAuthorsOptionsList = async () => {
      try {
            const authorsOptionsList = await BookAuthorModel.find({}).select('name').sort([['name', 'ASC']])
            return authorsOptionsList
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllAuthorsOptionsList
}
