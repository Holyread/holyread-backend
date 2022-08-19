import { RatingModel, BookSummaryModel, UserModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
import config from '../../../../config'

const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Get all ratings for table */
const getAllRatings = async (skip: number, limit, search: any, sort: { column: string, order: string }) => {
      try {
            const booksRatings = await RatingModel.find({}).select('userId bookId description star').lean()
            const books = await BookSummaryModel.find({}).select('coverImage title').lean().exec()
            let ratings = []
            await Promise.all(booksRatings.map(async (oneRating: any) => {
                  if (!oneRating) {
                        return
                  }
                  oneRating.star = Math.trunc(oneRating.star || 0)
                  const index = ratings.findIndex(oneRes => String(oneRes.bookId) === String(oneRating.bookId))
                  if (index >= 0) {
                        ratings[index].ratings[oneRating.star] = (ratings[index].ratings[oneRating.star] || 0) + 1
                  } else {
                        const bookDetails = books.find(oneBook => String(oneBook._id) === String(oneRating.bookId))
                        if (!bookDetails) return
                        const result = {
                              bookId: oneRating.bookId,
                              userId: oneRating.userId,
                              ratings: [],
                              bookTitle: bookDetails.title,
                              bookCoverImage: awsBucket[config.NODE_ENV].s3BaseURL + '/books/coverImage/' + bookDetails.coverImage
                        }
                        result.ratings[oneRating.star] = (result.ratings[oneRating.star] || 0) + 1
                        ratings.push(result)
                  }
            }))
            const count = ratings.length;
            /** Feat avarage ratings */
            ratings = ratings.map(item => {
                  let stars = 0
                  let users = 0
                  item.ratings.map((i, index) => {
                        if (!i) i = 0
                        stars += i * index
                        users += i
                  })
                  item.star = Number((stars / users).toFixed(1))
                  if (search.star && Number(search.star) !== Math.trunc(item.star || 0)) return null
                  if (search.search && !item.bookTitle.toLowerCase().includes(search.search)) return null
                  item.ratings = users
                  return item
            }).filter(i => i)
            /** sort books by star or sorting column */
            ratings = ratings.sort((a, b) => {
                  if (a[sort.column] < b[sort.column]) {
                        return sort.order.toLowerCase() === 'asc' ? -1 : 1;
                  }
                  if (a[sort.column] > b[sort.column]) {
                        return sort.order.toLowerCase() === 'asc' ? 1 : -1;
                  }
                  return 0;
            })
            return { count, ratings: ratings.slice(skip, skip + limit) }
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get all ratings for table */
const getBookRatings = async (skip: number, limit, search: any, sort: { column: string, order: string }) => {
      try {
            const bookDetails = await BookSummaryModel.findOne({ _id: search.bookId }).select('coverImage title').lean().exec()
            if (!bookDetails) throw new Error(bookSummaryControllerResponse.getBookSummaryFailure)
            const bookRatings = await RatingModel.find({ bookId: search.bookId }).select('userId bookId description star').lean()
            const userIds = bookRatings.map(i => i.userId).filter(i => i)
            const users = await UserModel.find({ _id: { '$in': userIds } }).select('email').lean().exec()
            let ratings = await Promise.all(bookRatings.map(async (oneRating: any) => {
                  if (!oneRating) {
                        return null
                  }
                  oneRating.star = Math.trunc(oneRating.star || 0)
                  const user = users.find(oneUser => String(oneUser._id) === String(oneRating.userId))
                  const item = {
                        bookId: oneRating.bookId,
                        userId: oneRating.userId,
                        user: user.email || user.firstName || '-',
                        star: oneRating.star,
                        bookTitle: bookDetails.title,
                        bookCoverImage: awsBucket[config.NODE_ENV].s3BaseURL + '/books/coverImage/' + bookDetails.coverImage,
                        ratings: oneRating.description
                  }
                  if (search.star && Math.trunc(item.star || 0) !== Math.trunc(search.star || 0)) return null
                  if (
                        search.search &&
                        (
                              !item.bookTitle.toLowerCase().includes(search.search) &&
                              !item.user.toLowerCase().includes(search.search) &&
                              !item.ratings.toLowerCase().includes(search.search)
                        )
                  ) return null
                  return item
            }))
            ratings = ratings.filter(i => i)
            ratings = ratings.sort((a, b) => {
                  if (a[sort.column] < b[sort.column]) {
                        return sort.order.toLowerCase() === 'asc' ? -1 : 1;
                  }
                  if (a[sort.column] > b[sort.column]) {
                        return sort.order.toLowerCase() === 'asc' ? 1 : -1;
                  }
                  return 0;
            })
            const count = ratings.length;
            return { count, ratings: ratings.slice(skip, skip + limit) }
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      getAllRatings,
      getBookRatings
}
