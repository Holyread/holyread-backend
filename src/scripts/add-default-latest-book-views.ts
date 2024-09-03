import { BookSummaryModel } from '../models/index';

// Add 777 views to books created after May 1, 2024
(async () => {
  try {
    console.log('Updating views for books created after May 1, 2024');

    const books = await BookSummaryModel.find({
      createdAt: { $gt: new Date('2024-05-01T00:00:00Z') } // Filter by created date greater than May 1, 2024
    }).select(['_id', 'views']).lean();

    if (!books?.length) {
      console.log('No books found created after May 1, 2024');
      return false;
    }

    await Promise.all(
      books.map(async (element) => {
        const newViews = (element.views || 0) + 777; // Add 777 to existing views or initialize to 0 if undefined
        await BookSummaryModel.updateOne(
          { _id: element._id },
          { views: newViews }
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
