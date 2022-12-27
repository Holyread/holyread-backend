import { UserModel, RatingModel, BookSummaryModel } from '../models/index'
import { randomNumberInRange } from '../lib/utils/utils'

/** Create ratings */
(async () => {
      try {
            /** Find bot user */
            const botUser = await UserModel.findOne({ email: 'bot@holyreads.com' }).select('_id').lean().exec()
            if (!botUser) {
                  console.log('Bot user does not exit');
                  return false;
            }
            /** Find books */
            const books = await BookSummaryModel.find({}).select('_id').lean().exec()
            if (!books?.length) {
                  console.log('Books store is empty')
                  return false;
            }
            await Promise.all(books.map(async book => {
                  const star = Number(`${randomNumberInRange(3, 5)}.${randomNumberInRange(1, 5)}`)
                  await RatingModel.findOneAndUpdate({ userId: botUser._id, bookId: book._id }, { star, updatedAt: new Date() }, { upsert: true })
                  console.log('bookId - ', book._id)
            }))
            console.log('Ratings added successfully')
      } catch (e: any) {
            console.log('Add ratings script execution failed - ', e)
      }
      return true;
})();
