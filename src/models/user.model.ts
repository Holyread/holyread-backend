import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IUser extends mongoose.Document {
    name: string,
    email: string,
    password: string,
    subscriptions?: 'Monthly' | 'Half-Yearly' | 'Yearly' | 'Expired',
    type: 'User' | 'Admin',
    status?: 'Active' | 'InActive',
    verified?: boolean,
    image?: string,
}

export type createUserType = {
    name: string,
    email: string,
    password: string,
    subscriptions?: 'Monthly' | 'Half-Yearly' | 'Yearly' | 'Expired',
    type: 'User' | 'Admin',
    status?: 'Active' | 'InActive',
    verified?: boolean,
    image?: string,
}

export type getUserType = {
    _id?: string,
    name: string,
    email: string,
    subscriptions?: 'Monthly' | 'Half-Yearly' | 'Yearly' | 'Expired',
    type: 'User' | 'Admin',
    status?: 'Active' | 'InActive',
    verified?: boolean,
    image?: string,
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
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const UserModel = mongoose.model<IUser>('user', UserSchema)
