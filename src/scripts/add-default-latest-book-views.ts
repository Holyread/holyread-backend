import { randomNumberInRange } from '../lib/utils/utils';
import { BookSummaryModel } from '../models/index';

// Add 700 to 2500 views to books latest books');
(async () => {
  try {
    console.log('Updating views for books latest books');

    const books = await BookSummaryModel.find()
      .select(['_id', 'views'])
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (!books?.length) {
      console.log('No books latest books found');
      return false;
    }

    await Promise.all(
      books.map(async (element) => {
        await BookSummaryModel.updateOne(
          { _id: element._id },
          { views: randomNumberInRange(700, 2500) }
        );
        console.log(`Views ${element._id} updated Successfully`);
      })
    );

    console.log('Views updated successfully');
  } catch (e: any) {
    console.log('Set default views script execution failed - ', e);
  }
  return true;
})();
