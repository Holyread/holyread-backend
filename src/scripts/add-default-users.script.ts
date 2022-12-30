import data from './data'
import config from '../../config'

import { UserModel } from '../models/index'
import { encrypt } from '../lib/utils/utils'
import { uploadFileToS3 } from '../lib/utils/utils'

import { awsBucket } from '../constants/app.constant'

const NODE_ENV = config.NODE_ENV
const s3Bucket = {
      region: awsBucket.region,
      bucketName: awsBucket[NODE_ENV].bucketName,
      documentDirectory: `${awsBucket.usersDirectory}`,
}

const createAdminBody = {
      firstName: 'A4Admin',
      lastName: '2022',
      email: 'holyread@mailinator.com',
      password: 'A4admin',
      verified: true,
      device: 'web',
      image: data.userpic
};

const createBotBody: any = {
      firstName: 'bot',
      lastName: '2022',
      email: 'bot@holyreads.com',
      password: encrypt('Bot@2022'),
      verified: true,
      type: 'User',
      status: 'Active',
      device: 'web'
};

/** Create Admin */
(async (body: any) => {
      try {
            /** Create bot user */
            await UserModel.findOneAndUpdate(
                  { email: createBotBody.email },
                  createBotBody,
                  { upsert: true }
            )

            /** Find admin */
            const existingUser = await UserModel
                  .findOne({ email: body.email })

            if (existingUser) {
                  console.log(
                        'Admin initiated successfully'
                  )
                  return true;
            }
            body.password = encrypt(body.password)

            if (body.image) {
                  const s3File: any = await uploadFileToS3(
                        body.image,
                        body.firstName,
                        s3Bucket
                  )

                  body.image = s3File.name
            }

            body.type = 'Admin'

            /** Create admin */
            await UserModel.create(body)
            await UserModel.updateOne(
                  { email: createBotBody },
                  { ...createBotBody}
            )
            console.log('Default users added successfully')

      } catch ({ message }) {
            console.log(
                  'Add default users script execution failed, Error: ',
                  message
            )
      }
      return true;
})(createAdminBody);

