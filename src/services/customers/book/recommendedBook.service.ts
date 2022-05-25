import { RecommendedBookModel, BookSummaryModel, BookAuthorModel } from '../../../models/index'

/** Get all recommended books for app */
const getAllRecommendedBooks = async (skip: number, limit, search: object, sort) => {
      try {
            let recommendedBooks: any = await RecommendedBookModel.find(search).skip(skip).limit(limit).sort(sort).lean().exec()
            let count: any = await RecommendedBookModel.count(search).lean().exec()
            recommendedBooks = await Promise.all(recommendedBooks.map(async item => {
                  if (item && item.book) {
                        item.book = await BookSummaryModel.findById(item.book).lean()
                        item.book = {
                              _id: item.book._id,
                              coverImage: item.book.coverImage,
                              coverImageBackground: item.book.coverImageBackground,
                              title: item.book.title,
                              author: item.book.author,
                              overview: item.book.overview,
                              shortDescription: item.book.shortDescription,
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
            return { recommendedBooks, count }
      } catch (e: any) {
            throw new Error(e)
      }
}
export default {
      getAllRecommendedBooks
}
