/** EN fallback title/description for every notification type.
 *  Used as the third argument to `getNotificationTemplate()` so all
 *  default strings live in one place rather than scattered across controllers. */
export const NOTIFICATION_TEMPLATE_FALLBACKS: Record<
  string,
  { title: string; description: string }
> = {
  // Welcome
  WELCOME: {
    title: "Welcome to Holy Reads 🎉",
    description:
      "Summarizing the best of Christian publishing for your busy schedule 📚",
  },

  // Plans
  FREE_ACCESS: {
    title: "Holy Reads Free access 🎉",
    description:
      "Enjoy unlimited free access with Holy Reads best summaries 🎉",
  },
  FREE_PLAN: {
    title: "Holy Reads Free Plan 🔔",
    description:
      "Enjoy unlimited free access with Holy Reads best summaries 📚",
  },

  // Account
  CHANGE_PASSWORD: {
    title: "Change Password",
    description:
      "A request has been received to change your Holy Reads account password.",
  },
  EMAIL_AUTH_ENABLED: {
    title: "Email auth enabled",
    description:
      "Now you can access Holy Reads by using your email and password",
  },
  PASSWORD_CHANGED: {
    title: "Password Changed Successfully",
    description:
      "Now you can access Holy Reads by using your email and password",
  },

  // Kindle
  ADD_KINDLE_EMAIL: {
    title: "Add Kindle Email",
    description:
      "Add your Kindle email to start receiving summaries on your device.",
  },
  UPDATE_KINDLE_EMAIL: {
    title: "Update Kindle Email",
    description:
      "Update your Kindle email to keep receiving summaries on your device.",
  },
  KINDLE_EMAIL_ADDED: {
    title: "Kindle email added",
    description: "Your Kindle email has been added successfully.",
  },
  KINDLE_EMAIL_UPDATED: {
    title: "Kindle email updated",
    description: "Your Kindle email has been updated successfully.",
  },

  // Subscription
  SUBSCRIPTION_ACTIVATED: {
    title: "Holy Reads Subscription",
    description: "Holy Reads {duration} subscription has been activated! 🎉",
  },
  SUBSCRIPTION_CANCELLED: {
    title: "Holy Reads Subscription Canceled ⛔",
    description: "Your Holy Reads {planTitle} Subscription Canceled",
  },

  // Invitation
  INVITATION: {
    title: "Holy Reads Invitation 🎁",
    description: "{inviterEmailUsername} invited you ✨",
  },

  // Notifications
  NEW_SUMMARY: {
    title: "🎉 NEW Summary for you!",
    description: '🎉 Explore the latest summary "{content}"',
  },
  FRESH_INSPIRATION: {
    title: "🎉 Fresh Inspiration Alert!",
    description:
      "🎉 Explore the latest in your favorite category with titles like {content}.",
  },
  DAILY_DEVOTION: {
    title: "🔔 Your daily devotional!",
    description: "📙 Your daily devotional for {seriesTitles} are available 🔖",
  },

  // App
  APP_UPDATE_AVAILABLE: {
    title: "A newer version of the app is available!",
    description: "Please go to the store and update the app.",
  },

  // Email Templates
  WELCOME_EMAIL: {
    title: "Welcome to Holy Reads – Your spiritual journey starts here!",
    description:
      "Thank you for downloading the Holy Reads app. We're truly glad you're here.",
  },

  // Password Reset
  PASSWORD_RESET: {
    title: "Reset your Holy Reads password",
    description:
      "A request has been received to change your Holy Reads account password.",
  },
};

export const NOTIFICATION_TEMPLATE = {
  // Welcome
  welcome: "WELCOME",

  // Plans
  freeAccess: "FREE_ACCESS",
  freePlan: "FREE_PLAN",

  // Account
  changePassword: "CHANGE_PASSWORD",
  emailAuthEnabled: "EMAIL_AUTH_ENABLED",
  passwordChanged: "PASSWORD_CHANGED",

  // Kindle
  addKindleEmail: "ADD_KINDLE_EMAIL",
  updateKindleEmail: "UPDATE_KINDLE_EMAIL",
  kindleEmailAdded: "KINDLE_EMAIL_ADDED",
  kindleEmailUpdated: "KINDLE_EMAIL_UPDATED",

  // Subscription
  subscriptionActivated: "SUBSCRIPTION_ACTIVATED",
  subscriptionCancelled: "SUBSCRIPTION_CANCELLED",

  // Invitation
  invitation: "INVITATION",

  // Notifications
  newSummary: "NEW_SUMMARY",
  freshInspiration: "FRESH_INSPIRATION",
  dailyDevotion: "DAILY_DEVOTION",

  // App
  appUpdateAvailable: "APP_UPDATE_AVAILABLE",

  // Email Templates
  welcomeEmail: "WELCOME_EMAIL",

  // Password Reset
  passwordReset: "PASSWORD_RESET",
} as const;

export type NotificationTemplateType =
  (typeof NOTIFICATION_TEMPLATE)[keyof typeof NOTIFICATION_TEMPLATE];
