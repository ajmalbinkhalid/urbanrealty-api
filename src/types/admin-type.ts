import type { Request } from "express";
import type mongoose from "mongoose";
import type { TIdentifierData } from ".";

export type TAdminOTPPayload = {
  tokenType: "reset-password" | "verify-account";
  adminData?: {
    email: string;
  };
  identifierData: TIdentifierData;
};

export interface AdminOTPSessionRequest extends Request {
  adminSession: TAdminOTPPayload;
}

/*
 * Login Token Types
 */
export type TAdminAuthPayload = {
  adminId: mongoose.Types.ObjectId;
  role: "super-admin" | "sub-admin";
  identifier: TIdentifierData;
};

export interface AdminRequest extends Request {
  admin: TAdminAuthPayload;
}
