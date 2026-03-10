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
    title: "Holy Reads Free access 🔔",
    description:
      "Enjoy unlimited free access with Holy Reads best summaries 📚",
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
  KINDLE_SYNC: {
    title: "🔔 Sync your favorite books with your Kindle account for free!",
    description:
      "📙 Click here to finish setting it up begin reading Holy Reads on your Kindle.",
  },

  // Subscription
  SUBSCRIPTION_ACTIVATED: {
    title: "Holy Reads Subscription",
    description: "Holy Reads {duration} subscription has been activated! 🎉",
  },
  SUBSCRIPTION_CANCELLED: {
    title: "Holy Reads Subscription Canceled ⛔",
    description: "Your Holy Reads {duration} Subscription Canceled",
  },
  RENEWAL_REMINDER: {
    title: "Holy Reads Renewal Reminder ⏳",
    description:
      "Holy Reads gently reminds you that your {planTitle} plan will upgrade tomorrow ✨",
  },

  // Invitation
  INVITATION: {
    title: "Holy Reads Invitation 🎁",
    description: "{inviterEmailUsername} invited you ✨",
  },

  // Notifications
  NEW_SUMMARY: {
    title: "🔔 NEW Summary for you!",
    description: '📙 Explore the latest summary "{content}"',
  },
  FREE_DAILY_SUMMARY: {
    title: "🔔 Free Summary For YOU! 😊",
    description: "📙 Enjoy your free daily summary {bookTitle}.",
  },

  FRESH_INSPIRATION: {
    title: "🔔 Fresh Inspiration Alert!",
    description:
      "📙 Explore the latest in your favorite category with titles like {content}.",
  },
  DAILY_DEVOTIONAL_CATEGORY: {
    title: "🔔 Your daily devotional!",
    description: "📙 Your daily devotional for {seriesTitles} are available 🔖",
  },
  DAILY_DEVOTIONAL: {
    title: "🔔 Start your day with inspiration!",
    description:
      "📙 Today's Devotional: {title}. Dive in now for a dose of spiritual nourishment 🔖",
  },
  NEW_CONTENT: {
    title: "🔔 We have something new for you",
    description: "📙 Lets read {bookTitle}.",
  },

  // Engagement Motivation
  ENGAGEMENT_MOTIVATION: {
    title: "🔔 We miss you at Holy Reads!",
    description:
      "📙 You've missed out on some uplifting content like {bookTitle}",
  },
  UNFINISHED_CONTENT: {
    title: "🔔 You left something unfinished!",
    description: "📙 Let's read {bookTitle}.",
  },

  // Notes & HighLights
  NOTES_AND_HIGHLIGHTS: {
    title: "🔔 Notes and highlights!",
    description:
      "📙 By long pressing on your favorite line, you can make highlights and share them with your friends as quotes or images.",
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
  freeDailySummary: "FREE_DAILY_SUMMARY",

  // notes & highLight
  notesAndHighlights: "NOTES_AND_HIGHLIGHTS",

  // Account
  changePassword: "CHANGE_PASSWORD",
  emailAuthEnabled: "EMAIL_AUTH_ENABLED",
  passwordChanged: "PASSWORD_CHANGED",

  // Kindle
  addKindleEmail: "ADD_KINDLE_EMAIL",
  kindleSync: "KINDLE_SYNC",
  updateKindleEmail: "UPDATE_KINDLE_EMAIL",
  kindleEmailAdded: "KINDLE_EMAIL_ADDED",
  kindleEmailUpdated: "KINDLE_EMAIL_UPDATED",

  // Subscription
  subscriptionActivated: "SUBSCRIPTION_ACTIVATED",
  subscriptionCancelled: "SUBSCRIPTION_CANCELLED",
  renewalReminder: "RENEWAL_REMINDER",

  // Invitation
  invitation: "INVITATION",

  // engagement motivation
  engagementMotivation: "ENGAGEMENT_MOTIVATION",
  newContent: "NEW_CONTENT",
  unfinishedContent: "UNFINISHED_CONTENT",

  // Notifications
  newSummary: "NEW_SUMMARY",
  freshInspiration: "FRESH_INSPIRATION",
  dailyDevotional: "DAILY_DEVOTIONAL",
  dailyDevotionalCategory: "DAILY_DEVOTIONAL_CATEGORY",

  // App
  appUpdateAvailable: "APP_UPDATE_AVAILABLE",

  // Email Templates
  welcomeEmail: "WELCOME_EMAIL",

  // Password Reset
  passwordReset: "PASSWORD_RESET",
} as const;

export type NotificationTemplateType =
  (typeof NOTIFICATION_TEMPLATE)[keyof typeof NOTIFICATION_TEMPLATE];
