export const setDefaultLanguage = async () => {
  try {
    console.log("🚀 Setting default language migration...");

    // @ts-ignore
    const { LanguageModel } = require("../models/language.model");

    const english = await LanguageModel.findOne({ code: "en" });

    if (!english) {
      console.error("❌ English language not found! Migration skipped.");
      return;
    }

    // @ts-ignore
    const { BookSummaryModel } = require("../models/bookSummary.model");
    // @ts-ignore
    const { BookCategoryModel } = require("../models/bookCategory.model");
    // @ts-ignore
    const { BookAuthorModel } = require("../models/bookAuthor.model");
    // @ts-ignore
    const { ExpertCuratedModel } = require("../models/expertCurated.model");
    // @ts-ignore
    const { SmallGroupModel } = require("../models/smallGroup.model");
    // @ts-ignore
    const { MeditationModel } = require("../models/meditation.model");
    // @ts-ignore
    const { MeditationCategoryModel } = require("../models/meditationCategory.model");
    // @ts-ignore
    const { CmsModel } = require("../models/cms.model");
    // @ts-ignore
    const { FaqModel } = require("../models/faq.model");
    // @ts-ignore
    const { TestimonialModel } = require("../models/testimonial.model");
    // @ts-ignore
    const { DailyDvotionalModel } = require("../models/dailyDvotional.model");
    // @ts-ignore
    const { UserModel } = require("../models/user.model");
    // @ts-ignore
    const { EmailTemplateModel } = require("../models/emailTemplate.model");

    const models = [
      BookSummaryModel,
      BookCategoryModel,
      BookAuthorModel,
      ExpertCuratedModel,
      SmallGroupModel,
      MeditationModel,
      MeditationCategoryModel,
      CmsModel,
      FaqModel,
      TestimonialModel,
      DailyDvotionalModel,
      UserModel,
      EmailTemplateModel,
    ];

    const BATCH_SIZE = 1000;

    for (const model of models) {
      console.log(`\n📋 Processing ${model.modelName}...`);
      
      let totalUpdated = 0;
      let batchNumber = 1;

      while (true) {
        // Find documents that need updating
        const docs = await model
          .find({ language: { $exists: false } })
          .limit(BATCH_SIZE)
          .select("_id")
          .lean();

        // No more documents to update
        if (docs.length === 0) break;

        // Update this batch
        const ids = docs.map((doc) => doc._id);
        const result = await model.updateMany(
          { _id: { $in: ids } },
          { $set: { language: english._id } }
        );

        totalUpdated += result.modifiedCount;
        console.log(`   Batch ${batchNumber}: Updated ${result.modifiedCount} docs (Total: ${totalUpdated})`);
        
        batchNumber++;

        // Small delay to reduce DB load
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (totalUpdated > 0) {
        console.log(`✅ ${model.modelName}: ${totalUpdated} docs updated`);
      } else {
        console.log(`ℹ️  ${model.modelName}: No updates needed`);
      }
    }

    console.log("\n🎉 Default language migration complete");
  } catch (err) {
    console.error("❌ Default language migration failed:", err);
  }
};
