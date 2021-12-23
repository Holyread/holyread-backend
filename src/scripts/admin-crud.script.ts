import { UserModel } from '../models/index'
import { getToken, encrypt } from '../lib/utils/utils'
import { uploadImageToAwsS3 } from '../lib/utils/utils'
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

export default { createAdmin }
