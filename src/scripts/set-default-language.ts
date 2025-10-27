export const setDefaultLanguage = async () => {
  try {
    console.log("🚀 Setting default language migration...");

    // ✅ Runtime requires — not type-checked
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

    for (const model of models) {
      const result = await model.updateMany(
        { language: { $exists: false } },
        { $set: { language: english._id } }
      );

      if (result.modifiedCount > 0)
        console.log(`✅ Added language to ${result.modifiedCount} docs in ${model.modelName}`);
      else
        console.log(`ℹ️ No missing language fields for ${model.modelName}. Skipped.`);
    }

    console.log("🎉 Default language migration complete\n");
  } catch (err) {
    console.error("❌ Default language migration failed:", err);
  }
};
