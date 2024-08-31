import { RatingModel, BookSummaryModel } from '../../../models/index'
import { responseMessage } from '../../../constants/message.constant'
import { FilterQuery } from 'mongoose';
import { IRating } from '../../../models/rating.model';

const bookSummaryControllerResponse =
      responseMessage.bookSummaryControllerResponse;

/** Update rating */
const updateRating = async (body: {
      bookId: string;
      star: number;
      description?: string;
      userId: string;
}) => {
      try {
            const bookDetails = await BookSummaryModel.findById(body.bookId)
                  .select('_id')
                  .lean()
                  .exec();
            if (!bookDetails) {
                  throw new Error(bookSummaryControllerResponse.getBookSummaryFailure);
            }
            await RatingModel.findOneAndUpdate(
                  { bookId: body.bookId, userId: body.userId },
                  { ...body, updatedAt: new Date() },
                  { runValidators: true, upsert: true }
            )
                  .lean()
                  .exec();
            return true;
      } catch (e: any) {
            throw new Error(e);
      }
};

/** Get book ratings */
const getBooksRatings = async (bookIds: [string], userId: string) => {
      try {
            const bookRatings = await RatingModel.find({ bookId: { '$in': bookIds } }).select('userId bookId').lean()
            const book = {}
            await Promise.all(bookRatings.map(async (oneRating: any) => {
                  if (!oneRating) {
                        return undefined
                  }
                  book[String(oneRating.bookId)] = {
                        isRate: book[oneRating.bookId]?.isRate || String(userId) === String(oneRating.userId),
                  };
            }))
            for (const item in book) {
                  book[item] = {
                        isRate: book[item].isRate,
                  };
            }
            return book;
      } catch (e: any) {
            throw new Error(e);
      }
};

/** Get book ratings */
const deleteRatings = async (query: FilterQuery<IRating>) => {
      try {
            await RatingModel.deleteMany(query);
            return true;
      } catch (e: any) {
            throw new Error(e);
      }
};

const getAllRating = async (query) => {
      try {
            const ratings = await RatingModel.find(query);
            return ratings;
      } catch (e: any) {
            throw new Error(e);
      }
};

export default {
      updateRating,
      getBooksRatings,
      deleteRatings,
      getAllRating,
}
