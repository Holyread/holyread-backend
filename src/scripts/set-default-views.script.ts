import { randomNumberInRange } from '../lib/utils/utils';
import { BookSummaryModel, ExpertCuratedModel } from '../models/index'

// Set default views
(async () => {
      try {
            const books = await BookSummaryModel.find(
                  {
                        $or: [
                              { views: { $exists: false } },
                              { views: 0 },
                        ],
                  }
            ).select([]).lean();

            const curateds = await ExpertCuratedModel.find(
                  {
                        $or: [
                              { views: { $exists: false } },
                              { views: 0 },
                        ],
                  }
            ).select([]).lean();

            await Promise.all(books.map(async (element) => {
                  await BookSummaryModel.updateOne(
                        { _id: element._id },
                        { views: randomNumberInRange(5, 15) }
                  )
            }))

            await Promise.all(curateds.map(async (element) => {
                  await ExpertCuratedModel.updateOne(
                        { _id: element._id },
                        { views: randomNumberInRange(5, 15) }
                  )
            }))

            console.log(
                  'views added successfully'
            )

      } catch (e: any) {
            console.log(
                  'Set default views script execution failed - ',
                  e
            )
      }
      return true;
})();
