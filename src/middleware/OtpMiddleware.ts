import env from "@env";
import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { AdminOTPSessionRequest } from "@/types/admin-type";
import type { AgencyOTPSessionRequest, TAgencyOTPPayload } from "@/types/agency-type";
import type { UserOTPSessionRequest } from "@/types/user-type";
import logger from "@/utils/logger";

class OTPMiddlewareClass {
  agency(req: AgencyOTPSessionRequest, res: Response, next: NextFunction): Response | undefined {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token not found",
      });
    }

    try {
      const token = authHeader.split(" ")[1];

      const decodeData = jwt.verify(token, env.OTP_SECRET_KEY) as TAgencyOTPPayload;

      if (!decodeData) {
        return res.status(401).json({
          success: false,
          message: "Session token expired.",
        });
      }

      req.agencySession = decodeData;

      next();
    } catch (_error) {
      logger.info("OTPMiddlewareClass ~ agency ~ _error:", _error)
      return res.status(401).json({
        success: false,
        message: "Session token is expired.",
      });
    }
  }

  user(req: UserOTPSessionRequest, res: Response, next: NextFunction): Response | undefined {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token not found",
      });
    }

    try {
      const token = authHeader.split(" ")[1];

      const decodeData = jwt.verify(token, env.OTP_SECRET_KEY);

      if (!decodeData) {
        return res.status(401).json({
          success: false,
          message: "Session token expired.",
        });
      }

      req.userSession = decodeData as unknown as UserOTPSessionRequest["userSession"];

      next();
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: "Session token is expired.",
      });
    }
  }

  admin(req: AdminOTPSessionRequest, res: Response, next: NextFunction): Response | undefined {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Session token not found",
      });
    }

    try {
      const token = authHeader.split(" ")[1];

      const decodeData = jwt.verify(token, env.OTP_SECRET_KEY);

      if (!decodeData) {
        return res.status(401).json({
          success: false,
          message: "Session token expired.",
        });
      }

      req.adminSession = decodeData as unknown as AdminOTPSessionRequest["adminSession"];
      next();
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: "Session token is expired.",
      });
    }
  }
}

export const OTPMiddleware = new OTPMiddlewareClass();
