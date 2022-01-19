import { RecommendedBookModel } from '../../models/index'

/** Create recommended book */
const createRecommendedBook = async (body: any) => {
      try {
            let result: any = await RecommendedBookModel.create(body)
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Update recommended book */
const updateRecommendedBook = async (body: any, id: string) => {
      try {
            const result: any = await RecommendedBookModel.findOneAndUpdate(
                  { _id: id },
                  { ...body, updatedAt: new Date() },
                  { new: true }
            ).lean() 
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get one recommended book by filter */
const getOneRecommendedBookByFilter = async (query: any) => {
      try {
            const result: any = await RecommendedBookModel.findOne(query).populate('book', 'title -_id').lean()
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all recommended books for table */
const getAllRecommendedBooks = async (skip: number, limit, search: object, sort) => {
      try {
            const recommendedBooks: any = await RecommendedBookModel.find(search).skip(skip).limit(limit).sort(sort).populate('book', 'title -_id').lean()
            const count = await RecommendedBookModel.find(search).count()
            return { count, recommendedBooks: recommendedBooks }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Remove recommended book */
const deleteRecommendedBook = async (id: string) => {
      try {
            await RecommendedBookModel.findOneAndDelete({ _id: id })
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      createRecommendedBook,
      updateRecommendedBook,
      getOneRecommendedBookByFilter,
      getAllRecommendedBooks,
      deleteRecommendedBook
}
