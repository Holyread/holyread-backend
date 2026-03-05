import { addLanguages } from "./add-default-language";
import { setDefaultLanguage } from "./set-default-language";
import { addDevotionalCategories } from "./add-devotional-category";
import { seedNotificationTemplates } from "./seed-notification-templates";

/**
 * Runs language migration scripts sequentially
 * Order: add-default-language -> set-default-language -> add-devotional-category -> seed-notification-templates
 */
export const runLanguageMigration = async () => {
  try {
    console.log("🚀 Starting language migration sequence...\n");

    // Step 1: Add default languages (English, Spanish)
    console.log("═══════════════════════════════════════");
    console.log("Step 1/4: Adding default languages");
    console.log("═══════════════════════════════════════");
    await addLanguages();

    // Step 2: Set default language for existing documents
    console.log("\n═══════════════════════════════════════");
    console.log("Step 2/4: Setting default language");
    console.log("═══════════════════════════════════════");
    await setDefaultLanguage();

    // Step 3: Add devotional categories
    console.log("\n═══════════════════════════════════════");
    console.log("Step 3/4: Adding devotional categories");
    console.log("═══════════════════════════════════════");
    await addDevotionalCategories();

    // Step 4: Seed notification templates (EN + ES)
    console.log("\n═══════════════════════════════════════");
    console.log("Step 4/4: Seeding notification templates");
    console.log("═══════════════════════════════════════");
    await seedNotificationTemplates();

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
