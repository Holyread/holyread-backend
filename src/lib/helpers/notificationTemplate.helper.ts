import { NotificationTemplateModel } from "../../models";
import { LanguageModel } from "../../models/language.model";

/**
 * Fetches a notification template (title + description) from the DB by type and language.
 * Falls back to the provided fallback values if the template is not found.
 *
 * @param type     - NOTIFICATION_TEMPLATE enum value (e.g. "WELCOME")
 * @param languageId - MongoDB ObjectId (string | undefined) of the user's language
 * @param fallback  - Default title/description to use if the template is not found
 */
export const getNotificationTemplate = async (
  type: string,
  languageId: string | undefined,
  fallback: { title: string; description: string },
): Promise<{ title: string; description: string }> => {
  try {
    // Resolve language: try provided languageId first, otherwise find EN as default
    let resolvedLanguageId = languageId;

    if (!resolvedLanguageId) {
      const enLang = await LanguageModel.findOne({ code: "en" }).lean();
      resolvedLanguageId = enLang?._id?.toString();
    }

    if (!resolvedLanguageId) {
      return fallback;
    }

    const template = await NotificationTemplateModel.findOne({
      type,
      language: resolvedLanguageId,
    }).lean();

    if (!template) {
      return fallback;
    }

    return {
      title: template.title,
      description: template.description,
    };
  } catch {
    // Never crash the caller due to a template lookup failure
    return fallback;
  }
};
