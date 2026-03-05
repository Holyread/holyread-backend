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
