import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface ISetting extends mongoose.Document {
    metaKeyword?: string;
    metaDescription?: string;
    copyRight?: string;
    adminPaging?: number;
    adminReceiveEmail?: string;
    contactEmail?: string;
    contactNumber?: number;
    facebookLink?: string;
    googlePlusLink?: string;
    twitterLink?: string;
    iosAppLink?: string;
    androidAppLink?: string;
    maxDeviceLogin?: number;
    dailyDevotionalTime: string;
}

export type createSettingType = {
    metaKeyword?: string;
    metaDescription?: string;
    copyRight?: string;
    adminPaging?: number;
    adminReceiveEmail?: string;
    contactEmail?: string;
    contactNumber?: number;
    facebookLink?: string;
    googlePlusLink?: string;
    twitterLink?: string;
    iosAppLink?: string;
    androidAppLink?: string;
    maxDeviceLogin?: number;
    dailyDevotionalTime: string;
}

export type getSettingType = {
    _id?: string,
    metaKeyword?: string;
    metaDescription?: string;
    copyRight?: string;
    adminPaging?: number;
    adminReceiveEmail?: string;
    contactEmail?: string;
    contactNumber?: number;
    facebookLink?: string;
    googlePlusLink?: string;
    twitterLink?: string;
    iosAppLink?: string;
    androidAppLink?: string;
    maxDeviceLogin?: number;
    dailyDevotionalTime: string;
}

export const SettingSchema = new Schema({
    metaKeyword: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    copyRight: { type: String, default: '' },
    adminPaging: { type: Number, default: '' },
    adminReceiveEmail: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactNumber: { type: Number, default: 0 },
    facebookLink: { type: String, default: '' },
    googlePlusLink: { type: String, default: '' },
    twitterLink: { type: String, default: '' },
    iosAppLink: { type: String, default: '' },
    androidAppLink: { type: String, default: '' },
    maxDeviceLogin: { type: Number, default: 3 },
    dailyDevotionalTime: { type: String, default: '8:0' },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const SettingModel = mongoose.model<ISetting>('setting', SettingSchema)
