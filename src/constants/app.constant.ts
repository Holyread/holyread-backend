export const allowedOrigins = {
    test: ['*'],
    local: ['http://localhost:4200'],
    development: ['http://localhost:4200', 'https://dev-admin.holyreads.com', 'https://dev-customer.holyreads.com'],
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
