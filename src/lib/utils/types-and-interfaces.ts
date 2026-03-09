import { Types } from "mongoose";

/**
 * Extend express Request object with language
 */
declare global {
  namespace Express {
    interface Request {
      language?: Types.ObjectId;
    }

    interface Request {
      user?: { id: Types.ObjectId; role: string };
      languageId: any;
    }
  }
}

export {};
