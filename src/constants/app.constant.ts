export const allowedOrigins = {
    test: ['*'],
    local: ['http://localhost:3000'],
    development: ['http://localhost:3000'],
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
    production: { bucketName: 'holyreads-production', s3BaseURL: 'https://alinea-production.s3.amazonaws.com' },
    usersDirectory: 'users',
    region: 'us-east-1',
}