import { NextFunction, Request, Response } from 'express'

const handleError = async (err: any, req: Request, res: Response, next: NextFunction) => {
    if (!err) { return next() }

    const errorResponse = Object.assign({ stack: err.stack, errorCode: err.errorCode }, err.output && err.output.payload ? err.output.payload : err)
    console.log('app errors', err.stack)
    const statusCode = err.output && err.output.statusCode ? err.output.statusCode : 500
    return res.status(statusCode).json(errorResponse)
}

export default { handleError }
