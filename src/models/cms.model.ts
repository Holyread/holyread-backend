import mongoose, {Schema} from 'mongoose'

mongoose.set('autoIndex', true);

export interface ICms extends mongoose.Document {
    title: string,
    metaTitle: string,
    metaKeyword: string,
    metaDescription: string,
    content: string
}

export type createCmsType = {
    title: string,
    metaTitle: string,
    metaKeyword: string,
    metaDescription: string,
    content: string
}

export type getCmsType = {
    _id?: string,
    title?: string,
    metaTitle?: string,
    metaKeyword?: string,
    metaDescription?: string,
    content?: string
}

export const CmsSchema = new Schema({
    title: { type: String, required: true, unique : true, index: true },
    metaTitle: { type: String, required: true, index: true },
    metaKeyword: { type: String, required: true },
    metaDescription: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const CmsModel = mongoose.model<ICms>('cms', CmsSchema)
