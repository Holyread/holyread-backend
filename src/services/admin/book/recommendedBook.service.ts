import { FilterQuery, Types } from 'mongoose'
import { RecommendedBookModel } from '../../../models/index'
import { IRecommendedBook } from '../../../models/recommendedBooks.model'

/** Create recommended book */
const createRecommendedBook = async (body: any) => {
      try {
            const result: any = await RecommendedBookModel.create(body)
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
            if (result && result.book) {
                  result.book = result.book.title
            }
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all recommended books for table */
const getAllRecommendedBooks = async (
  skip: number,
  limit,
  search: FilterQuery<IRecommendedBook>,
  sort,
  language?: Types.ObjectId
) => {
  try {
    const query = { ...search };
    const recommendedBooks = await RecommendedBookModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .populate({
        path: "book",
        match: { language },
        populate: { path: "author", select: "name" },
      })
      .lean()
      .exec();

      const filteredRecommendedBooks = recommendedBooks.filter((item: any) => item.book)
      const count = filteredRecommendedBooks.length;
    return { count, recommendedBooks: filteredRecommendedBooks };
  } catch (e: any) {
    throw new Error(e);
  }
};

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
      deleteRecommendedBook,
}
