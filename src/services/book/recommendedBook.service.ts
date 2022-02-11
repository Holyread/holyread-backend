import { RecommendedBookModel, BookSummaryModel, BookAuthorModel } from '../../models/index'

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
            if (result && result.book) {
                  result.book = result.book.title
            }
            return result
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all recommended books for table */
const getAllRecommendedBooks = async (skip: number, limit, search: object, sort, isForApp?: any) => {
      try {
            const recommendedBooks = await RecommendedBookModel.find(search).skip(skip).limit(limit).sort(sort).populate({ path: 'book', populate: { path: 'author', select: 'name' } }).lean()
            const count = await RecommendedBookModel.find(search).count()
            return { count, recommendedBooks: recommendedBooks }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all recommended books for app */
const getAllRecommendedBooksForApp = async (skip: number, limit, search: object, sort) => {
      try {
            let recommendedBooks: any = await RecommendedBookModel.find(search).skip(skip).limit(limit).sort(sort).lean()
            recommendedBooks = await Promise.all(recommendedBooks.map(async item => {
                  if (item && item.book) {
                        item.book = await BookSummaryModel.findById(item.book).lean()
                        item.book = {
                              _id: item.book._id,
                              coverImage: item.book.coverImage,
                              coverImageBackground: item.book.coverImageBackground,
                              title: item.book.title,
                              author: item.book.author,
                              overview: item.book.overview
                        }
                  }
                  if (item && item.book && item.book.author) {
                        item.book.author = await BookAuthorModel.findById(item.book.author).select('name about').lean()
                        item.book.author = {
                              _id: item.book.author._id,
                              name: item.book.author.name,
                              about: item.book.author.about
                        }
                  }
                  return item
            }))
            return recommendedBooks
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
      getAllRecommendedBooksForApp,
      deleteRecommendedBook
}
