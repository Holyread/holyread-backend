export const allowedOrigins = {
    test: ['*'],
    local: ['https://localhost:4200', 'http://localhost:4200'],
    development: ['https://localhost:4200', 'http://localhost:4200', 'https://dev-admin.holyreads.com', 'https://dev-customer.holyreads.com'],
    staging: [''],
    production: [''],
}

export const origins = {
    test: '*',
    local: 'http://localhost:4200',
    development: 'https://dev-customer.holyreads.com',
    staging: '',
    production: '',
}

export const awsBucket = {
    local: { bucketName: 'holyreads-develop', s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com' },
    development: { bucketName: 'holyreads-develop', s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com' },
    production: { bucketName: 'holyreads-production', s3BaseURL: 'https://holyreads-production.s3.amazonaws.com' },
    usersDirectory: 'users',
    bookDirectory: 'books',
    expertCuratedDirectory: 'expertCurated',
    testimonialDirectory: 'testimonial',
    shareImageDirectory: 'shareImage',
    readsOfDayDirectory: 'readsOfDay',
    region: 'us-east-1',
}

export const dataTable = {
    limit: 100,
    skip: 0,
}

export const dataLimit = {
    limit: 10,
    skip: 0,
}

export const originEmails = {
    contactUs: 'holyreads@mailinator.com'
}

export const emailTemplatesTitles = {
    customer: {
        registration: 'Customer Registration',
        forgotPassword: 'Customer Forgot Password',
        contactUs: 'Contact Us',
        feedback: 'Client Feedback',
        sendInvitation: 'Send Invitation',
        blessFriend: 'Customer Registration Bless Friend',
        chooseSubscription: 'Choose Subscription'
    },
    admin: {
        customerRegistration: 'Admin Customer Registration',
        login: 'Admin Login',
        forgotPassword: 'Forgot Password'
    }
}
