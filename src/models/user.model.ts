import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IUser extends mongoose.Document {
    name: string,
    email: string,
    password: string,
    subscriptions?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'InActive' | 'Suspended',
    verified?: boolean,
    image?: string,
    verificationCode?: number,
    emailNotification?: boolean,
    notificationSetting?: boolean,
    metaKeyword?: string,
    metaDescription?: string,
    copyright?: string,
    adminPaging?: string,
    adminReceiveEmail?: string,
    contactEmail?: string,
    contactNumber?: string,
    facebookLink?: string,
    googlePlusLink?: string,
    twitterLink?: string,
    iosAppLink?: string,
    androidAppLink?: string,
    maxDevicesLogin?: string
}

export type createUserType = {
    name: string,
    email: string,
    password: string,
    subscriptions?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'InActive' | 'Suspended',
    verified?: boolean,
    image?: string,
    verificationCode?: number,
    emailNotification?: boolean,
    notificationSetting?: boolean,
    metaKeyword?: string,
    metaDescription?: string,
    copyright?: string,
    adminPaging?: string,
    adminReceiveEmail?: string,
    contactEmail?: string,
    contactNumber?: string,
    facebookLink?: string,
    googlePlusLink?: string,
    twitterLink?: string,
    iosAppLink?: string,
    androidAppLink?: string,
    maxDevicesLogin?: string
}

export type getUserType = {
    _id?: string,
    name: string,
    email: string,
    subscriptions?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'InActive' | 'Suspended',
    verified?: boolean,
    image?: string,
    verificationCode?: number,
    emailNotification?: boolean,
    notificationSetting?: boolean,
    metaKeyword?: string,
    metaDescription?: string,
    copyright?: string,
    adminPaging?: string,
    adminReceiveEmail?: string,
    contactEmail?: string,
    contactNumber?: string,
    facebookLink?: string,
    googlePlusLink?: string,
    twitterLink?: string,
    iosAppLink?: string,
    androidAppLink?: string,
    maxDevicesLogin?: string
}

export const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, validate: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ },
    password: { type: String, required: true },
    subscriptions: { type: String },
    type: { type: String, required: true },
    status: { type: String },
    verified: { type: Boolean },
    image: { type: String },
    verificationCode: { type: String },
    emailNotification: { type: Boolean },
    notificationSetting: { type: Boolean },
    metaKeyword: { type: String },
    metaDescription: { type: String },
    copyright: { type: String },
    adminPaging: { type: String },
    adminReceiveEmail: { type: String },
    contactEmail: { type: String },
    contactNumber: { type: String },
    facebookLink: { type: String },
    googlePlusLink: { type: String },
    twitterLink: { type: String },
    iosAppLink: { type: String },
    androidAppLink: { type: String },
    maxDevicesLogin: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const UserModel = mongoose.model<IUser>('user', UserSchema)
