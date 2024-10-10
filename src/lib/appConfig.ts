import { NextFunction, Request, Response } from 'express';

// Define a custom error type to better handle error objects
interface CustomError extends Error {
    output?: {
        statusCode?: number;
        payload?: any;
    };
    errorCode?: string;
    data?: any;
}

const handleError = async (err: CustomError, req: Request, res: Response, next: NextFunction): Promise<any> => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // If there's no error, proceed to the next middleware
    if (!err) return next();

    // Log the error stack for debugging purposes
    console.error('app errors', err.stack);

    // Create a structured error response
    const errorResponse = {
        message: err.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        errorCode: err.errorCode || 'UNKNOWN_ERROR',
        ...err.output?.payload,
        ...(err.data || {}),
    };

    const statusCode = err.output?.statusCode || 422; // Default to 422 Unprocessable Entity

    // Send the error response
    return res.status(statusCode).json(errorResponse);
};

export default { handleError };
