import { BookSummaryModel, ReadsOfDayModel, BookCategoryModel, SmallGroupModel } from '../models/index'

/** Add Short description in to models where missing */
(async () => {
      try {
            const query = { 'shortDescription': { '$exists': false } }
            await BookSummaryModel.updateMany(query, { shortDescription: '' }).lean().exec();
            await ReadsOfDayModel.updateMany(query, { shortDescription: '' }).lean().exec();
            await BookCategoryModel.updateMany(query, { shortDescription: '' }).lean().exec();
            await SmallGroupModel.updateMany(query, { shortDescription: '' }).lean().exec();
            console.log('Short description added successfully')
      } catch (e: any) {
            console.log('Add Short description script execution failed - ', e)
      }
      return true;
})();
