import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom';

import usersService from '../../services/users/user.service'
import { responseMessage } from '../../constants/message.constant'
import { sentEmail } from '../../lib/utils/utils'

const adminControllerResponse = responseMessage.adminControllerResponse

/** Process forgot password request */
const forgotPassoword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.body.email
        /** Get user from db */
        const user: any = await usersService.getOneUserByFilter({ email, type: 'Admin' })
        if (!user) {
            return next(Boom.badData(adminControllerResponse.getAdminFailure))
        }
        const code = Math.floor(100000 + Math.random() * 900000)
        const result = await sentEmail(email, 'Verification Code', `Your verification code is: ${code}`);
        if (!result) {
            next(Boom.badData(adminControllerResponse.forgotPassowrdFailure))
        }
        await usersService.updateUser({ code }, user._id)
        res.status(200).send({
            message: adminControllerResponse.sendCodeSuccess
        })
    } catch (e) {
        next(Boom.badData(e.message))
    }
}

/**  verify new password */
const verifyPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, newPassword, code }: any = req.body
        /** Get user from db */
        const userObj: any = await usersService.getOneUserByFilter({ email, code, type: 'Admin' })
        if (!userObj) {
            next(Boom.notFound(adminControllerResponse.forgotPassowrdFailure))
        }
        await usersService.updateUser({ password: newPassword, $unset: { code: 1 } }, userObj._id)
        res.status(200).send({ message: adminControllerResponse.forgotPassowrdSuccess })
    } catch (e) {
        next(Boom.badData(e.message))
    }
}

export default { forgotPassoword, verifyPassword }
