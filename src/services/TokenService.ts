import { UnauthenticatedError } from "@utils/custom-errors";
import dayjs from "dayjs";
import env from "env";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import type { TAdminAuthPayload, TAdminOTPPayload } from "@/types/admin-type";
import type { TAgencyAuthPayload } from "@/types/agency-type";
import type { TUserAuthPayload } from "@/types/user-type";

class TokenServiceClass {
  generateAgencyToken(payload: TAgencyAuthPayload): { accessToken: string; expiresIn: Date } {
    const JWT_EXPIRES_MILLISECONDS = Number(env.JWT_EXPIRY_DAYS) * 24 * 60 * 60 * 1000;

    const accessToken = jwt.sign(payload, env.JWT_SECRET_KEY, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_MILLISECONDS,
    });

    const expiresIn = dayjs().add(JWT_EXPIRES_MILLISECONDS, "milliseconds").toDate();
    return { accessToken, expiresIn };
  }

  verifyAgencyToken(token: string): TAgencyAuthPayload | undefined {
    try {
      const data = jwt.verify(token, env.JWT_SECRET_KEY) as TAgencyAuthPayload | undefined;

      if (data) {
        data.agencyId = new mongoose.Types.ObjectId(data.agencyId);
        data.agencyTeamId = new mongoose.Types.ObjectId(data.agencyTeamId);
      }

      return data;
    } catch (_error) {
      throw new UnauthenticatedError("Invalid or expired agency token");
    }
  }

  generateUserToken(payload: TUserAuthPayload): { accessToken: string; expiresIn: Date } {
    const JWT_EXPIRES_MILLISECONDS = Number(env.JWT_EXPIRY_DAYS) * 24 * 60 * 60 * 1000;

    const accessToken = jwt.sign(payload, env.JWT_SECRET_KEY, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_MILLISECONDS,
    });

    const expiresIn = dayjs().add(JWT_EXPIRES_MILLISECONDS, "milliseconds").toDate();
    return { accessToken, expiresIn };
  }

  verifyUserToken(token: string): TUserAuthPayload | undefined {
    try {
      const data = jwt.verify(token, env.JWT_SECRET_KEY) as TUserAuthPayload | undefined;
      if (data) {
        data.userId = new mongoose.Types.ObjectId(data.userId);
      }

      return data;
    } catch (_error) {
      throw new UnauthenticatedError("Invalid or expired user token");
    }
  }

  generateAdminToken(payload: TAdminAuthPayload): { accessToken: string; expiresIn: Date } {
    const JWT_EXPIRES_MILLISECONDS = Number(env.JWT_EXPIRY_DAYS) * 24 * 60 * 60 * 1000;

    const accessToken = jwt.sign(payload, env.JWT_SECRET_KEY, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_MILLISECONDS,
    });

    const expiresIn = dayjs().add(JWT_EXPIRES_MILLISECONDS, "milliseconds").toDate();
    return { accessToken, expiresIn };
  }

  verifyAdminToken(token: string): TAdminAuthPayload | undefined {
    try {
      const data = jwt.verify(token, env.JWT_SECRET_KEY) as TAdminAuthPayload | undefined;

      if (data) {
        data.adminId = new mongoose.Types.ObjectId(data.adminId);
      }

      return data;
    } catch (_error) {
      throw new UnauthenticatedError("Invalid or expired admin token");
    }
  }

  generateAdminResetToken(payload: TAdminOTPPayload): { sessionToken: string; expiresIn: Date } {
    const JWT_EXPIRES_MILLISECONDS = Number(env.OTP_EXPIRY_MINUTES) * 60 * 1000;

    const sessionToken = jwt.sign(payload, env.OTP_SECRET_KEY, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_MILLISECONDS,
    });

    const expiresIn = dayjs().add(JWT_EXPIRES_MILLISECONDS, "milliseconds").toDate();
    return { sessionToken, expiresIn };
  }

  verifyAdminResetToken(token: string): TAdminOTPPayload | undefined {
    try {
      return jwt.verify(token, env.OTP_SECRET_KEY) as TAdminOTPPayload | undefined;
    } catch (_error) {
      throw new UnauthenticatedError("Invalid or expired admin token");
    }
  }
}

export const TokenService = new TokenServiceClass();
