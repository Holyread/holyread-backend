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
        s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com'
    },
    development: {
        bucketName: 'holyreads-develop',
        s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com'
    },
    production: {
        bucketName: 'holyreads-production',
        s3BaseURL: 'https://holyreads-production.s3.amazonaws.com'
    },
    region: 'us-east-1',
    bookDirectory: 'books',
    usersDirectory: 'users',
    shareImageDirectory: 'shareImage',
    smallGroupDirectory: 'smallGroup',
    readsOfDayDirectory: 'readsOfDay',
    testimonialDirectory: 'testimonial',
    expertCuratedDirectory: 'expertCurated',
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
    contactUs: 'info@holyreads.com'
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
        subscriptionCancelled: 'Subscription Cancelled',
        subscriptionActivated: 'Subscription Activated',
        emailAuthEnabled: 'Customer Email Auth Enabled',
        blessFriend: 'Customer Registration Bless Friend',
        emailAuthVerification: 'Customer Email Auth Verification',
    },
    admin: {
        customerRegistration: 'Admin Customer Registration',
        login: 'Admin Login',
        forgotPassword: 'Forgot Password',
        customerInquiry: 'Customer Inquiry',
        customerFeedback: 'Customer Feedback',
    }
}

export const fireStoreConfig = {
    'type': 'service_account',
    'project_id': 'holyreads-1649330389089',
    'private_key_id': 'd84821fc8d0e5ca21c5bfaee9fea923656496fd4',
    'private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqdbXMYkBTojA7\nHIQKR1w7oXrDKaoyiI3oIKaJSPE3Mu3tg8VvQSNSzahO0ToOaRAH2HIPzzVTtVX2\ncU2h/bKpI9SnZGXUtg94ug70YU3CxUUj/8P1YLWlRvlPEzdnZz2O/0kcw97xt0B2\n1sqxebm07kFua8H1pAL7VOK3I87M2tmJ8btlyxG1NinoVn3Tm16bRPmzVZmZAIhA\n5YlSxjPfZd2wmBHdB3Z1sD7jMczxk6/qaMy8OG0g13BRwSj4Sf/j00kd0Zm+ZE12\nV+nHXzEMYMqULXGlMUAUN7dI9RwbNqCGI//ifdHtTiopLaLGMJ64gkfH2dSrtk6I\np2C1WQmhAgMBAAECggEAG6NOQL9Fcsn/S/ZJqmj7mWeLQg2FXQArEhIJLoU3Jx4I\n2dPdtTY4hfp2aaEe6qs6QCtmAw4ztUjXkUe5sKQzzZzTo/hxUlXamFaCijkkpInb\ntgSIP0bY7N1fGuUgvJFOt9rIffN8OHDf8OTOpIv6Ak4HKeIq5qsbGKkgwVT6+NfX\nWloTk4prxbOuYq1rHoDdZCqWbl9BQmrBWOZLidoQC1aCJaOY3Hf9C57jHoMME9B7\nKUP5i7Ann0UIAKq1xooIs0kFuwne+dw//Qhd2IAhtLowVWlueTU9vj6p8XYnlDHM\nJGO6nZs8BnXoSJvj0Erf+Y61hIEWKJoN6rkx0AwaiQKBgQDYAIgWkmitsZaKvxXb\n1l2wq5I6dr4FuCNCqcjQzn0XRs+u3t5BpJbniRlodudizEvSQLJZkJ/DOT8/ZlIW\nNSJ5a0vcvJ2mWhvZBVmYt970i5RMOCMMbkNyJ4O6kfIObudL+qWaH1bLxqFusJgV\nMXwkKiqhEWnx3eR6RVF6CFMk7wKBgQDKBkU3/OszZNK+FiDWIDkCFqGUSCnroPjv\nWYrDBGpovaBpBYeLs5/7lnyPRSlYrq/rThaOi/iQ3O4ewv2XC289roBdM0sgczDA\nim0FiSpR4EDU6DZwIwkysGpboj4NqigZwZttlYatc8UxEzOV3TRyvWbBR+Obc5EC\nc9RrJrBabwKBgGW/QluXldWT3Lz4q/xFKxboitYdTv90sK9bOOwbCFOpmHTgKMO1\nGxxvuVc7A13HrEObFCgadxdH5SIhObOaTeXyA+cztfNBaPK+kWjd3BlHkpCgtOnL\nGtwv/t4ol2PzG+Lva4iBEKqmoy534vvAtqB2eGQsxsIW6uQpuOqJ91hjAoGAKGwS\nw34WrYTZ6fDRhyaRYYqXr+y0fpIJ3RJEgnrKs8RlaT4S/e/l7dgRejUzbaweRO2t\n872r8YhTGNKZHPTLwEK/KmbN/GMv+QZ5g+cLEbDWKAOCiPNprru/vC/9TIykU2r6\np3WIqgIFDamy46SMDv04pym0L/FyrVPxx7LJDH8CgYEAuri9xc01oLbPQjSA4EQ9\nasw4uLdZWloW85dUXZwU3uS4l/WP5yqm1XPmJkk9sZ9efNcL+oja92BaaekraOz1\nyRGTM6duC7CiBdTvk+yWGWZ65bA4e64W37esV44qiYztAh1CdegoUbu0zgTFVuUJ\ntJ3ffU04E6X2oJElGTyP0lg=\n-----END PRIVATE KEY-----\n',
    'client_email': 'firebase-adminsdk-fbog5@holyreads-1649330389089.iam.gserviceaccount.com',
    'client_id': '100129774021760704084',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
    'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
    'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbog5%40holyreads-1649330389089.iam.gserviceaccount.com'
}
