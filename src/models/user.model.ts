import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IUser extends mongoose.Document {
    firstName?: string,
    lastName?: string,
    email: string,
    password: string,
    subscriptions?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'Deactive',
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
    maxDevicesLogin?: string,
    library?: {
        saved?: [string],
        completed?: [string],
        reading?: [{
            bookId: string,
            chaptersCompleted: [string]
        }],
    },
    smallGroups?: [string],
    oAuth?: {
        clientId: string,
        provider: string
    },
    referralUserId?: string,
    kindleEmail?: string,
    stripeSessionId?: string
}

export type createUserType = {
    firstName?: string,
    lastName?: string,
    email: string,
    password: string,
    subscriptions?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'Deactive',
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
    maxDevicesLogin?: string,
    library?: {
        saved?: [string],
        completed?: [string],
        reading?: [{
            bookId: string,
            chaptersCompleted: [string]
        }]
    },
    smallGroups?: [string],
    oAuth?: {
        clientId: string,
        provider: string
    },
    referralUserId?: string,
    kindleEmail?: string,
    stripeSessionId?: string,
}

export type getUserType = {
    _id?: string,
    firstName?: string,
    lastName?: string,
    email: string,
    subscriptions?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'Deactive',
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
    maxDevicesLogin?: string,
    library?: {
        saved?: [string],
        completed?: [string],
        reading?: [{
            bookId: string,
            chaptersCompleted: [string]
        }]
    },
    smallGroups?: [string],
    oAuth?: {
        clientId: string,
        provider: string
    },
    referralUserId?: string,
    kindleEmail?: string,
    stripeSessionId?: string
}

export const UserSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    password: { type: String },
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
    library: {
        saved: [{ type: String }],
        completed: [{ type: String }],
        reading: [{
            bookId: { type: String },
            chaptersCompleted: [{ type: String }],
            updatedAt: { type: Date }
        }]
    },
    smallGroups: [{ type: String }],
    oAuth: {
        clientId: String,
        provider: String
    },
    referralUserId: { type: Schema.Types.ObjectId, ref: 'user' },
    kindleEmail: { type: String },
    stripeSessionId: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const UserModel = mongoose.model<IUser>('user', UserSchema)
