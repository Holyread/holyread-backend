import { RatingModel, BookSummaryModel, UserModel } from '../../../models/index'
import { awsBucket } from '../../../constants/app.constant'
import { responseMessage } from '../../../constants/message.constant'
import config from '../../../../config'

const bookSummaryControllerResponse = responseMessage.bookSummaryControllerResponse

/** Get all ratings for table */
const getAllRatings = async (skip: number, limit, search: any, sort: { column: string, order: string }) => {
      try {
            const booksRatings = await RatingModel
                  .find({})
                  .select('userId bookId description star')
                  .lean()
            const books = await BookSummaryModel
                  .find({})
                  .select('coverImage title')
                  .lean()
                  .exec()

    let ratingsMap = new Map<string, any>(); // Use a map to group ratings by bookId

    // Group ratings by bookId and count comments
    booksRatings.forEach((oneRating: any) => {
      if (!oneRating) return;

      const { bookId, description, star, userId } = oneRating;
      const key = String(bookId);

      // Initialize book entry if not present
      if (!ratingsMap.has(key)) {
        ratingsMap.set(key, {
          bookId,
          userId,
          ratings: {},
          bookTitle: '',
          bookCoverImage: '',
          comment: 0,
        });
      }

      const currentRating = ratingsMap.get(key);

      // Increment the description count if a description is present
      if (description) {
        currentRating.comment += 1;
      }

      // Add or update star rating counts
      currentRating.ratings[`${star}`] = {
        stars: (currentRating.ratings[`${star}`]?.stars || 0) + star,
        users: (currentRating.ratings[`${star}`]?.users || 0) + 1,
      };

      ratingsMap.set(key, currentRating); // Update the map
    });

    let ratings = Array.from(ratingsMap.values());

    // Merge book details with ratings
    ratings = ratings.map((item) => {
      const bookDetails = books.find(
        (oneBook) => String(oneBook._id) === String(item.bookId)
      );
      if (!bookDetails) return undefined;

      item.bookTitle = bookDetails.title;
      item.bookCoverImage = awsBucket[config.NODE_ENV].s3BaseURL + '/books/coverImage/' + bookDetails.coverImage;


      let stars = 0;
      let users = 0;
      for (let i in item.ratings) {
        stars += item.ratings[i].stars;
        users += item.ratings[i].users;
      }
      item.star = Number((stars / users).toFixed(1));

      // Apply search filters
      if (search.star && Number(search.star) !== Math.trunc(item.star || 0)) {
        return undefined;
      }

                  if (
                        search.search &&
                        !item.bookTitle.toLowerCase().includes(search.search)
                  ) { return undefined }

      item.ratings = users;
      return item;
    }).filter(Boolean); // Remove undefined entries

            const count = ratings.length;

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
            return {
                  count,
                  ratings: ratings.slice(skip, skip + limit),
            }
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
                        return undefined
                  }
                  oneRating.star = oneRating.star || 0
                  const user : any = users.find(oneUser => String(oneUser._id) === String(oneRating.userId))
                  const item = {
                        bookId: oneRating.bookId,
                        userId: oneRating.userId,
                        user: user.email || user.firstName || '-',
                        star: oneRating.star,
                        bookTitle: bookDetails.title,
                        bookCoverImage: awsBucket[config.NODE_ENV].s3BaseURL + '/books/coverImage/' + bookDetails.coverImage,
                        ratings: oneRating.description,
                  }
                  if (search.star && Math.trunc(item.star || 0) !== Math.trunc(search.star || 0)) return undefined
                  if (
                        search.search &&
                        (
                              !item.bookTitle.toLowerCase().includes(search.search) &&
                              !item.user.toLowerCase().includes(search.search) &&
                              !item.ratings.toLowerCase().includes(search.search)
                        )
                  ) return undefined
                  return item
            }))
            ratings = ratings.filter(i => i)
            ratings = ratings.sort((a: any, b: any) => {
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
      getBookRatings,
}
