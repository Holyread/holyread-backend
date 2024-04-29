import { calculateAverageRating } from '../lib/utils/utils';
import { BookSummaryModel } from '../models/index'
import ratingService from '../services/customers/book/rating.service';

/**
 * Initialize books  by machine user
*/
(async () => {
    try {
        /** Find books */
        const books = await BookSummaryModel
            .find({})
            .select('_id')
            .lean()
            .exec()

        if (!books?.length) {
            console.log('ReadsOfDays is empty')
            return false;
        }
        await Promise.all(books.map(async item => {
            const ratings = await ratingService.getAllRating({ bookId: item._id });
            const averageRating = await calculateAverageRating(ratings);
            await BookSummaryModel.findOneAndUpdate(
                { _id: item._id },
                { totalStar: averageRating, updatedAt: new Date() },
                { upsert: true }
            )

            console.log('readsOfDaysId: ', item._id)
        }))

        console.log('Rating added successfully')
    } catch ({ message }: any) {
        console.log(
            'Rating added  script execution failed: Error: ',
            message
        )
    }
    return true;
})();
