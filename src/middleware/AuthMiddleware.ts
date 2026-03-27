import type { NextFunction, Response } from "express";
import { TokenService } from "@/services/TokenService";
import type { AdminRequest } from "@/types/admin-type";
import type { AgencyRequest } from "@/types/agency-type";
import type { UserRequest } from "@/types/user-type";

class AuthMiddlewareClass {
  agency(req: AgencyRequest, res: Response, next: NextFunction): Response | undefined {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token not found",
      });
    }

    try {
      const token = authHeader.split(" ")[1];

      const decodeData = TokenService.verifyAgencyToken(token);

      if (!decodeData) {
        return res.status(401).json({
          success: false,
          message: "Access token expired.",
        });
      }

      req.agency = decodeData;

      next();
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: "Access token expired.",
      });
    }
  }

  user(req: UserRequest, res: Response, next: NextFunction): Response | undefined {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token not found",
      });
    }

    try {
      const token = authHeader.split(" ")[1];

      const decodeData = TokenService.verifyUserToken(token);

      if (!decodeData) {
        return res.status(401).json({
          success: false,
          message: "Access token expired.",
        });
      }

      req.user = decodeData;

      next();
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: "Access token expired.",
      });
    }
  }

  admin(req: AdminRequest, res: Response, next: NextFunction): Response | undefined {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token not found",
      });
    }

    try {
      const token = authHeader.split(" ")[1];

      const decodeData = TokenService.verifyAdminToken(token);

      if (!decodeData) {
        return res.status(401).json({
          success: false,
          message: "Access token expired.",
        });
      }

      req.admin = decodeData;
      next();
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: "Access token expired.",
      });
    }
  }

  guestUser(req: UserRequest, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    try {
      const token = authHeader.split(" ")[1];
      const decodeData = TokenService.verifyUserToken(token);

      if (decodeData) {
        req.user = decodeData;
      }

      next();
    } catch (_error) {
      next();
    }
  }
}
export const AuthMiddleware = new AuthMiddlewareClass();
