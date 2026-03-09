import {
  NOTIFICATION_TEMPLATE,
  NOTIFICATION_TEMPLATE_FALLBACKS,
} from "../../constants/notificationTemplate.constant";
import { getNotificationTemplate } from "./notificationTemplate.helper";

const formatDuration = (duration: string): string =>
  duration?.includes("Half") ? duration : `1 ${duration}` || "";

export const buildSubscriptionNotification = async (
  duration: string,
  languageId: string | undefined,
): Promise<{ title: string; description: string }> => {
  const formattedDuration = formatDuration(duration || "");

  const template = await getNotificationTemplate(
    NOTIFICATION_TEMPLATE.subscriptionActivated,
    languageId,
    NOTIFICATION_TEMPLATE_FALLBACKS[
      NOTIFICATION_TEMPLATE.subscriptionActivated
    ],
  );

  return {
    title: template.title,
    description: template.description.replace("{duration}", formattedDuration),
  };
};
