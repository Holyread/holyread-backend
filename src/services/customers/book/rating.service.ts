import { RatingModel, BookSummaryModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'

const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Update rating */
const updateRating = async (body: { bookId: string, star: number, description?: string, userId: string }) => {
      try {
            const bookDetails = await BookSummaryModel.findById(body.bookId).select('_id').lean().exec()
            if (!bookDetails) {
                  throw new Error(bookSummaryControllerResponse.getBookSummaryFailure)
            }
            await RatingModel.findOneAndUpdate({ bookId: body.bookId, userId: body.userId }, { ...body, updatedAt: new Date() }, { upsert: true }).lean().exec()
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get book ratings */
const getBooksRatings = async (bookIds: [string], userId: string) => {
      try {
            const bookRatings = await RatingModel.find({ bookId: { '$in': bookIds } }).select('userId bookId star').lean()
            let book = {}
            await Promise.all(bookRatings.map(async (oneRating: any) => {
                  if (!oneRating) {
                        return null
                  }
                  book[String(oneRating.bookId)] = { star: (book[oneRating.bookId]?.star || 0) + oneRating.star, users: (book[oneRating.bookId]?.users || 0) + 1, isRate: book[oneRating.bookId]?.isRate || String(userId) === String(oneRating.userId) }
            }))
            for (const item in book) {
                  book[item] = { averageStar: Number((book[item].star / book[item].users).toFixed(1)), isRate: book[item].isRate }
            }
            return book
      } catch (e: any) {
            throw new Error(e)
      }
}

/** Get book ratings */
const deleteRatings = async (query: Object) => {
      try {
            await RatingModel.deleteMany(query)
            return true
      } catch (e: any) {
            throw new Error(e)
      }
}

export default {
      updateRating,
      getBooksRatings,
      deleteRatings
}
