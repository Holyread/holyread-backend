export const allowedOrigins = {
    test: ['*'],
    local: ['http://localhost:4200'],
    development: ['http://localhost:4200', 'https://dev.holyreads.com'],
    staging: [''],
    production: [''],
}

export const baseUrls = {
    local: 'http://localhost:5000',
    development: '',
    staging: '',
    production: '',
};

export const awsBucket = {
    local: { bucketName: 'holyreads-develop', s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com' },
    development: { bucketName: 'holyreads-develop', s3BaseURL: 'https://holyreads-develop.s3.amazonaws.com' },
    production: { bucketName: 'holyreads-production', s3BaseURL: 'https://holyreads-production.s3.amazonaws.com' },
    usersDirectory: 'users',
    region: 'us-east-1',
}

export const dataTable = {
    limit: 100,
    skip: 0,
}
