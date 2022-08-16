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

export default {
      updateRating
}
