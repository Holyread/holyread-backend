import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/users/user.service'
import bookSummaryService from '../../services/book/bookSummary.service'
import { responseMessage } from '../../constants/message.constant'

const dashboardControllerResponse = responseMessage.dashboardControllerResponse

/** Get Dashboard */
const getDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const getUsersList = await usersService.getAllUsers(0, 0, {}, [])
        const bookSummaryList: any = await bookSummaryService.getAllBookSummaries(0, 0, {}, [])
        let audioCount: number = 0
        let videoCount: number = 0
        await bookSummaryList.summaries.map(async oneSummary => {
            if (oneSummary && oneSummary.videoFile) {
                videoCount += 1
            }
            if (oneSummary && oneSummary.chapters && oneSummary.chapters.length) {
                await oneSummary.chapters.map(oneChapter => {
                    if (oneChapter && oneChapter.audioFile) {
                        audioCount += 1
                    }
                })
            }
        })
        response.status(200).json({
            message: dashboardControllerResponse.getDashboardSuccess,
            data: { users: { count: getUsersList.count }, audio: { count: audioCount }, video: { count: videoCount } }
        })
    } catch (e: any) {
        next(Boom.badData(e.message))
    }
}

export { getDashboard }
