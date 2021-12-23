import mongoose from 'mongoose'
import config from '../../config'
import { UserModel } from './user.model'

const NODE_ENV = config.NODE_ENV
const option = { useNewUrlParser: true, useUnifiedTopology: true }

mongoose.Promise = global.Promise

// Dont connect to real db when running test configuration
if (NODE_ENV !== 'test') {
  mongoose
      .connect(config.DBURL, option)
      .then(async result => console.log('DB connected successfully'))
      .catch(err => console.error('Error while connecting DB', err))
}

export {
  mongoose,
  UserModel
}
