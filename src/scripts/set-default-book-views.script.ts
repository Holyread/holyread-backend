import { randomNumberInRange } from '../lib/utils/utils';
import { BookSummaryModel } from '../models/index'

/** Set default book views */
(async () => {
      try {
            const books = await BookSummaryModel.find(
                  {
                        $or: [
                              { views: { $gte: 8 } },
                              { views: { $lt: 9 } }
                        ]
                  }
            ).lean();

            await Promise.all(books.map(async (element) => {
                  await BookSummaryModel.updateOne(
                        { _id: element._id },
                        { views: randomNumberInRange(5, 15) }
                  );
            }))
            console.log('Book views added successfully')

      } catch (e: any) {
            console.log('Set default book views script execution failed - ', e)
      }
      return true;
})();
