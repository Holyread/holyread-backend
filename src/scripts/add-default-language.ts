import { LanguageModel } from '../models/language.model'

export const addLanguages = async () => {
  try {
    const languages = [
      { name: "English", code: "en" },
      { name: "Spanish", code: "es" },
    ];

    for (const language of languages) {
      const exists = await LanguageModel.findOne({ code: language.code });

      if (exists) {
        console.log(`⚠️ Language "${language.name}" already exists.`);
      } else {
        await LanguageModel.create(language);
        console.log(`✅ Language "${language.name}" added successfully.`);
      }
    }

    console.log("✅ Language seeding completed.\n");
  } catch (error) {
    console.error("❌ Language seeding failed:", error);
  }
};

