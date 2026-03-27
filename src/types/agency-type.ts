import type { Request } from "express";
import type mongoose from "mongoose";
import type { TIdentifierData, TTokenType } from ".";

export type TAgencyOTPPayload = {
  tokenType: TTokenType;
  agencyData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: {
      phoneCode: string;
      phoneNumber: string;
    };
    company: string;
    cRNumber: string;
  };
  identifierData: TIdentifierData;
};

export interface AgencyOTPSessionRequest extends Request {
  agencySession: TAgencyOTPPayload;
}

/*
 * Login Token Types
 */
export type TAgencyAuthPayload = {
  agencyId: mongoose.Types.ObjectId;
  agencyTeamId: mongoose.Types.ObjectId;
  role: "admin" | "member";
  identifier: TIdentifierData;
};

export interface AgencyRequest extends Request {
  agency: TAgencyAuthPayload;
}
