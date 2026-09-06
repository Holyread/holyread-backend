import config from '../../config'

export const allowedOrigins = {
    test: ['*'],
    staging: [''],
    local: [
        'http://localhost:4200',
        'https://localhost:4200',
    ],
    development: [
        'https://localhost:4200',
        'http://localhost:4200',
        'https://holyreads.com',
        'https://www.holyreads.com',
        'https://dev-admin.holyreads.com',
        'https://dev-customer.holyreads.com',
    ],
    production: [
        'https://holyreads.com',
        'https://app.holyreads.com',
        'https://www.holyreads.com',
        'https://admin.holyreads.com',
    ],
}

export const origins = {
    test: '*',
    staging: '',
    local: 'http://localhost:4200',
    production: 'https://app.holyreads.com',
    development: 'https://dev-customer.holyreads.com',
}

export const serverOrigins = {
    test: '*',
    staging: '',
    local: 'http://localhost:8000',
    production: 'https://api.holyreads.com',
    development: 'https://api-dev.holyreads.com',
}

export const awsBucket = {
    local: {
        bucketName: 'holyreads-develop',
        s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com',
    },
    development: {
        bucketName: 'holyreads-develop',
        s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com',
    },
    production: {
        bucketName: 'holyreads-production',
        s3BaseURL: 'https://holyreads-production.s3.amazonaws.com',
    },
    region: 'us-east-1',
    bookDirectory: 'books',
    usersDirectory: 'users',
    shareImageDirectory: 'shareImage',
    smallGroupDirectory: 'smallGroup',
    readsOfDayDirectory: 'readsOfDay',
    testimonialDirectory: 'testimonial',
    expertCuratedDirectory: 'expertCurated',
    devotionalCategoryDirectory: 'devotionalCategory',
    meditationDirectory: 'meditation',
}

export const dataTable = {
    skip: 0,
    limit: 100,
}

export const dataLimit = {
    skip: 0,
    limit: 10,
}

export const originEmails = {
    kindle: 'kindle@holyreads.com',
    marketing: 'noreply@holyreads.com',
    contactUs: 'info@holyreads.com',
}

export const emailTemplatesTitles = {
    customer: {
        sendInvitation: 'Send Invitation',
        changePassword: 'Change Password',
        registration: 'Customer Registration',
        HolyreadsSupport: 'Holy Reads Support',
        HolyreadsPlanUpgrade: 'Renewal Reminder',
        chooseSubscription: 'Choose Subscription',
        forgotPassword: 'Customer Forgot Password',
        welcomeToHolyreads: 'Welcome To Holy Reads',
        subscriptionCanceled: 'Subscription Canceled',
        subscriptionActivated: 'Subscription Activated',
        emailAuthEnabled: 'Customer Email Auth Enabled',
        blessFriend: 'Customer Registration Bless Friend',
        emailAuthVerification: 'Customer Email Auth Verification',
        holyReadsMission: 'Holy Reads Mission'
    },
    admin: {
        customerRegistration: 'Admin Customer Registration',
        login: 'Admin Login',
        forgotPassword: 'Forgot Password',
        customerInquiry: 'Customer Inquiry',
        customerFeedback: 'Customer Feedback',
        contentPipelineReminder: 'Holy Reads Content Pipeline',
    },
}

export const fireStoreConfig = {
    'type': 'service_account',
    'project_id': config.FIREBASE_PROJECT_ID,
    'private_key_id': config.FIREBASE_PRIVATE_KEY_ID,
    'private_key': config.FIREBASE_PRIVATE_KEY,
    'client_email': config.FIREBASE_CLIENT_EMAIL,
    'client_id': config.FIREBASE_CLIENT_ID,
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/'
        + encodeURIComponent(config.FIREBASE_CLIENT_EMAIL || ''),
}

export const trailDays = 10

export const BATCH_SIZE = 500;

export const cronDirectory = {
    CONTENTUPDATENOTIFICATION: 'contentUpdateNotification',
    DAILYDEVOTIONALNOTIFICATION: 'dailyDevotionalNotification',
    RENEWALREMINDERNOTIFICATION: 'renewalReminderNotification',
    SYNCPROFITS: 'syncProfits',
    SETSTRIPECOUPONANDSTATUS: 'setStripeCouponAndStatus',
    ENGAGEMENTMOTIVATIONNOTIFICATION: 'engagementMotivationNotification',
    UNFINISHEDBOOKNOTIFICATION: 'unfinishedBookNotification',
    HIGHLIGHTANDQUOTEFEATURENOTIFICATION: 'highlightAndQuoteFeatureNotification',
    KINDLESETUPNOTIFICATION: 'kindleSetUpNotification',
    SCHEDULEPERSONALIZENOTIFICATION: 'schedulePersonalizeNotification',
    PUBLISHSMALLGROUP: 'publishSmallGroup',
    PUBLISHCURATEDLIST: 'publishCuratedList',
    DAILYDEVOTIONALCATEGORIESNOTIFICATION: 'dailyDevotionalCategoriesNotification',
    PUBLISHDAILYDEVOTIONAL: 'publishDailyDevotional',
    CHECKUNINSTALLEDUSER: 'checkUninstalledUser',
    SCHEDULEFREEMIUMUSERRANDOMSUMMARYNOTIFICATION: 'scheduleFreemiumUserRandomSummaryNotification',
    PUBLISHMEDITATION: 'publishMeditation',
    PUBLISHCONTENT: 'publishContent',
    HOLYREADSMISSIONEMAIL: 'holyreadsmissionemail',
    LOWCONTENTPIPELINEALERT: 'lowContentPipelineAlert',
}
