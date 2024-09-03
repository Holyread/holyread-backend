import { randomNumberInRange } from '../lib/utils/utils';
import { BookSummaryModel } from '../models/index';

// Set default views
(async () => {
      try {
            console.log('Setting default views');
            const books = await BookSummaryModel.find({
                  createdAt: { $lt: new Date('2024-05-01T00:00:00Z') } // Filter by created date less than 5th Jan 2024
            }).select(['_id', 'views']).lean();

            if (!books?.length) {
                  console.log('Books is empty');
                  return false;
            }

            await Promise.all(
                  books.map(async (element) => {
                        await BookSummaryModel.updateOne(
                              { _id: element._id },
                              { views: randomNumberInRange(20000, 26000) }
                        );
                        console.log(`Views ${element._id} updated Successfully`);
                  })

            );

            console.log('Views added successfully');
      } catch (e: any) {
            console.log('Set default views script execution failed - ', e);
      }
      return true;
})();
