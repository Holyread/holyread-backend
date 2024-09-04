import { randomNumberInRange } from '../lib/utils/utils';
import { BookSummaryModel } from '../models/index';

// Set default views
(async () => {
      try {
            console.log('Setting default views randomly for books');
            const books = await BookSummaryModel.find()
                  .select(['_id', 'views'])
                  .sort({ createdAt: -1 }) // Sort by `createdAt` in descending order
                  .skip(50) // Skip the first 50 books
                  .lean();


            if (!books?.length) {
                  console.log('Books is empty');
                  return false;
            }

            await Promise.all(
                  books.map(async (element) => {
                        await BookSummaryModel.updateOne(
                              { _id: element._id },
                              { views: randomNumberInRange(15000, 35000) }
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
