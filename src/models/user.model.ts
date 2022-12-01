import mongoose, { Schema, Types } from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IUser extends mongoose.Document {
    firstName?: string,
    lastName?: string,
    email: string,
    password: string,
    subscription?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'Deactive',
    verified?: boolean,
    image?: string,
    verificationCode?: number,
    notification: {
        email?: boolean,
        push?: boolean,
        inApp?: boolean,
        dailyDevotional?: boolean,
        subscription?: boolean,
        offerAndDeal?: boolean
    },
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
    downloadOverWifi?: boolean,
    pushTokens?: [{
        deviceId: string,
        token: string
    }],
    libraries: Types.ObjectId,
    oAuth?: [{
        clientId: string,
        provider: string,
        email: String,
        default: Boolean
    }],
    referralUserId?: string,
    kindleEmail?: string,
    inAppSubscription?: Object, // default key - createdAt(Date)
    inAppSubscriptionStatus?: string,
    stripe: {
        subscriptionId?: string,
        customerId?: string,
        planId?: string,
        createdAt?: Date,
        planRenewRemindAt?: Date,
    },
    device: string,
    maxDevices: [string],
    timeZone?: string,
    createdAt: Date,
    updatedAt: Date,
    lastSeen: Date,
}

export type createUserType = {
    firstName?: string,
    lastName?: string,
    email: string,
    password: string,
    subscription?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'Deactive',
    verified?: boolean,
    image?: string,
    verificationCode?: number,
    notification: {
        email?: boolean,
        push?: boolean,
        inApp?: boolean,
        dailyDevotional?: boolean,
        subscription?: boolean,
        offerAndDeal?: boolean
    },
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
    downloadOverWifi?: boolean,
    pushTokens?: [{
        deviceId: string,
        token: string
    }],
    libraries: Types.ObjectId,
    oAuth?: [{
        clientId: string,
        provider: string,
        email: String,
        default: Boolean
    }],
    referralUserId?: string,
    kindleEmail?: string,
    inAppSubscription?: Object, // default key - createdAt(Date)
    inAppSubscriptionStatus?: string,
    stripe: {
        subscriptionId?: string,
        customerId?: string,
        planId?: string,
        createdAt?: Date,
        planRenewRemindAt?: Date,
    },
    device: string,
    maxDevices: [string],
    codes: Object,
    timeZone?: string,
    createdAt: Date,
    updatedAt: Date,
    lastSeen: Date
}

export type getUserType = {
    _id?: string,
    firstName?: string,
    lastName?: string,
    email: string,
    subscription?: string,
    type: 'User' | 'Admin',
    status?: 'Active' | 'Deactive',
    verified?: boolean,
    image?: string,
    verificationCode?: number,
    notification: {
        email?: boolean,
        push?: boolean,
        inApp?: boolean,
        subscription?: boolean,
        dailyDevotional?: boolean,
        offerAndDeal?: boolean
    },
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
    downloadOverWifi?: boolean,
    pushTokens?: [{
        deviceId: string,
        token: string
    }],
    libraries: Types.ObjectId,
    oAuth?: [{
        clientId: string,
        provider: string,
        email: String,
        default: Boolean
    }],
    referralUserId?: string,
    kindleEmail?: string,
    inAppSubscription?: Object, // default key - createdAt(Date)
    inAppSubscriptionStatus?: string,
    stripe: {
        subscriptionId?: string,
        customerId?: string,
        planId?: string,
        createdAt?: Date,
        planRenewRemindAt?: Date,
    },
    device: string,
    maxDevices: [string],
    codes: Object,
    timeZone?: string,
    createdAt: Date,
    updatedAt: Date,
    lastSeen: Date,
}

export const UserSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, index: true, validate: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ },
    password: { type: String },
    subscription: { type: String, ref: 'subscriptions' },
    type: { type: String, required: true, enum: ['User', 'Admin'] },
    status: { type: String, enum: ['Active', 'Deactive'] },
    verified: { type: Boolean },
    image: { type: String },
    verificationCode: { type: String },
    notification: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        subscription: { type: Boolean, default: true },
        dailyDevotional: { type: Boolean, default: true },
        offerAndDeal: { type: Boolean, default: true }
    },
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
    downloadOverWifi: { type: Boolean, default: false },
    pushTokens: [{
        deviceId: String,
        token: String
    }],
    libraries: { type: Schema.Types.ObjectId, ref: 'userLibrary', index: true },
    oAuth: [{
        clientId: String,
        provider: String,
        email: String,
        default: Boolean
    }],
    referralUserId: { type: Schema.Types.ObjectId, ref: 'user' },
    kindleEmail: { type: String },
    stripe: {
        subscriptionId: { type: String },
        customerId: { type: String },
        planId: { type: String },
        createdAt: { type: Date },
        planRenewRemindAt: { type: Date },
    },
    inAppSubscription: { type: Object }, // default key - createdAt(Date)
    inAppSubscriptionStatus: { type: String },
    device: { type: String, required: true },
    maxDevices: [{ type: String }], // max devices size depends on maxDevicesLogin
    timeZone: { type: String },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    codes: { type: Object },
    updatedAt: { type: Date },
    lastSeen: { type: Date },
}, { strict: 'throw' })

export const UserModel = mongoose.model<IUser>('user', UserSchema)
