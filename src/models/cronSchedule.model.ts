import mongoose, { Schema } from 'mongoose';

mongoose.set('autoIndex', true);

export interface ICronSchedule extends mongoose.Document {
    jobName: string;
    description: string;
    schedule: {
        Minutes: string;
        Hours: string;
        DayOfMonth: string;
        Months: string;
        DayOfWeek: string;
    };
    jobRestrictEnv: string[];
    cronExpression: string;
    status?: 'Active' | 'Deactive';
    createdAt: Date;
    updatedAt: Date;
}

export const CronScheduleSchema = new Schema<ICronSchedule>({
    jobName: { type: String, required: true },
    description: { type: String, required: true },
    schedule: {
        Minutes: { type: String, default: '*' },
        Hours: { type: String, default: '*' },
        DayOfMonth: { type: String, default: '*' },
        Months: { type: String, default: '*' },
        DayOfWeek: { type: String, default: '*' },
    },
    jobRestrictEnv: { type: [String], default: ['local', 'development', 'production'] },
    cronExpression: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Active' },
    updatedAt: { type: Date, default: Date.now },
}, { strict: true });

export const CronScheduleModel = mongoose.model<ICronSchedule>('CronSchedule', CronScheduleSchema);
