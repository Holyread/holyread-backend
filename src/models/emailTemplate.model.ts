import mongoose, {Schema} from 'mongoose'

mongoose.set('useCreateIndex', true)

export interface IEmailTemplate extends mongoose.Document {
    title: string,
    subject: string,
    content: string
}

export type createEmailTemplateType = {
    title: string,
    subject: string,
    content: string
}

export type getEmailTemplateType = {
    _id?: string,
    title?: string,
    subject?: string,
    content?: string
}

export const EmailTemplateSchema = new Schema({
    title: { type: String, required: true, unique : true, index: true },
    subject: { type: String, required: true, index: true },
    content: { type: String, required: true },
    createdAt: {
        type: Date, default: () => {
            return new Date()
        },
    },
    updatedAt: {type: Date},
}, {strict: 'throw'})

export const EmailTemplateModel = mongoose.model<IEmailTemplate>('emailTemplate', EmailTemplateSchema)
