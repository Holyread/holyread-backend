import { addLanguages } from "./add-default-language";
import { setDefaultLanguage } from "./set-default-language";
import { addDevotionalCategories } from "./add-devotional-category";

/**
 * Runs language migration scripts sequentially
 * Order: add-default-language -> set-default-language -> add-devotional-category
 */
export const runLanguageMigration = async () => {
  try {
    console.log("🚀 Starting language migration sequence...\n");

    // Step 1: Add default languages (English, Spanish)
    console.log("═══════════════════════════════════════");
    console.log("Step 1/3: Adding default languages");
    console.log("═══════════════════════════════════════");
    await addLanguages();

    // Step 2: Set default language for existing documents
    console.log("\n═══════════════════════════════════════");
    console.log("Step 2/3: Setting default language");
    console.log("═══════════════════════════════════════");
    await setDefaultLanguage();

    // Step 3: Add devotional categories
    console.log("\n═══════════════════════════════════════");
    console.log("Step 3/3: Adding devotional categories");
    console.log("═══════════════════════════════════════");
    await addDevotionalCategories();

    console.log("\n✅ Language migration sequence completed successfully!");
  } catch (error) {
    console.error("❌ Language migration sequence failed:", error);
  }
};

(async () => {
  try {
    await runLanguageMigration();
  } catch (error) {
    console.error("Fatal error:", error);
  }
})();
