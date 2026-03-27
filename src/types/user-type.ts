import type { Request } from "express";
import type mongoose from "mongoose";
import type { TIdentifierData, TTokenType } from ".";

export type TUserOTPPayload = {
  tokenType: TTokenType;
  userData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: {
      phoneCode: string;
      phoneNumber: string;
    };
  };
  identifierData: TIdentifierData;
};

export interface UserOTPSessionRequest extends Request {
  userSession: TUserOTPPayload;
}

export interface UserProfileOTPSessionRequest extends Request {
  userSession: TUserOTPPayload;
  user: TUserAuthPayload;
}

/*
 * Login Token Types
 */
export type TUserAuthPayload = {
  userId: mongoose.Types.ObjectId;
  identifier: TIdentifierData;
};

export interface UserRequest extends Request {
  user: TUserAuthPayload;
}
