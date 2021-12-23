import { UserModel } from '../models/index'
import { getToken, encrypt } from '../lib/utils/utils'
import { uploadImageToAwsS3, removeImageToAwsS3 } from '../lib/utils/utils'
import { awsBucket } from '../constants/app.constant'
import config from '../../config'

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
      region: awsBucket.region,
      bucketName: awsBucket[NODE_ENV].bucketName,
      documentDirectory: `${awsBucket.usersDirectory}`,
}
/** Add Admin */
const createAdmin = async (body: any) => {
      try {
            const existingUser = await UserModel.findOne({ email: body.email })
            if (existingUser) {
                  console.log('Admin initiated successfully')
                  return true;
            }
            body.password = encrypt(body.password)
            if (body.image) {
                  body.image = await uploadImageToAwsS3(body.image, body.name, s3Bucket)
            }
            body.type = 'Admin'
            const result = await UserModel.create(body)
            const token: string = getToken({ email: result.email })
            console.log('Admin created successfully')
            return { _id: result._id, email: result.email, token }
      } catch (e) {
            throw new Error(e)
      }
}

/** Modify Admin */
const updateAdmin = async (body: any, id: string) => {
      try {
            if (body.password) {
                  body.password = encrypt(body.password)
            }
            const userDetails = await UserModel.findOne({ _id: id })
            if (body.image && userDetails && userDetails.image) {
                  await removeImageToAwsS3(userDetails.image, s3Bucket)
                  body.image = await uploadImageToAwsS3(body.image, userDetails.name, s3Bucket)
            }
            await UserModel.findOneAndUpdate({ _id: id }, body).lean()
            return true
      } catch (e) {
            throw new Error(e)
      }
}

/** Remove Admin */
const deleteAdmin = async (id: string) => {
      try {
            const userDetails = await UserModel.findOne({ _id: id })
            if (userDetails && userDetails.image) {
                  await removeImageToAwsS3(userDetails.image, s3Bucket)
            }
            await UserModel.findOneAndDelete({ _id: id })
            return true
      } catch (e) {
            throw new Error(e)
      }
}

export default { createAdmin, updateAdmin, deleteAdmin }
