import { AdminModel, type TAdminModel } from "@database/models/AdminModel";
import { StringHelpers } from "@utils/string-helpers";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { NotificationTokenModel } from "@/database/models/NotificationTokenModel";
import { ActorTypeEnum } from "@/enum/actor-type-enum";
import { StatusEnum } from "@/enum/StatusEnum";
import type { TAppUserDeleteNotificationRequest, TAppUserSaveNotificationRequest } from "@/routes/app/user/validations/UserAuthRouterValidation";
import type { TAdminLoginRequest, TAdminRequestOtpRequest, TAdminResetPasswordRequest, TAdminVerifyOtpRequest } from "@/routes/dashboard/validations/AuthRouterValidation";
import { OTPService } from "@/services/OTPService";
import { TokenService } from "@/services/TokenService";
import type { TIdentifierData } from "@/types";
import type { AdminOTPSessionRequest, AdminRequest } from "@/types/admin-type";
import { DBHelper } from "@/utils/db-helpers";
import { OTPSourceEnum } from "../../enum/OTPSourceEnum";
import { ResJson } from "../../utils/response-json";

class AdminAuthControllerClass {
  static getAdmin(admin: TAdminModel): Record<string, unknown> {
    return {
      adminId: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      permissions: [],
      role: admin.isAdmin ? "super-admin" : "sub-admin",
    };
  }

  async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as TAdminLoginRequest;
      const normalizedEmail = StringHelpers.normalizeEmail(email);

      const user = await AdminModel.findOne({
        email: normalizedEmail,
        deletedAt: null,
      }).lean();

      if (!user) {
        ResJson.unauthenticated(res, "Authentication failed. User not found.");
        return;
      }

      if (user.status !== StatusEnum.active) {
        ResJson.unauthenticated(res, "Authentication failed. User is not active.");
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        ResJson.unauthenticated(res, "Authentication failed. Invalid password.");
        return;
      }

      const role = user.isAdmin ? "super-admin" : "sub-admin";

      const { accessToken, expiresIn } = TokenService.generateAdminToken({
        adminId: user._id,
        role,
        identifier: {
          identifier: user.email,
          identifierType: "email",
          source: OTPSourceEnum.adminDashboard,
        },
      });

      ResJson.success(res, "Authentication successful", {
        accessToken,
        expiresIn,
        admin: AdminAuthControllerClass.getAdmin(user),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async adminRequestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body as TAdminRequestOtpRequest;

      if (!email) {
        ResJson.invalid(res, "Email is required");
        return;
      }

      const normalizedEmail = StringHelpers.normalizeEmail(email);

      const identifierData: TIdentifierData = {
        identifier: normalizedEmail,
        identifierType: "email",
        source: OTPSourceEnum.adminDashboard,
      };

      const admin = await AdminModel.findOne({
        email: normalizedEmail,
        deletedAt: null,
        status: StatusEnum.active,
      }).lean();

      if (!admin) {
        ResJson.invalid(res, "Admin not found");
        return;
      }

      const { expiresAt, sessionToken, otp } = await OTPService.generateAndSendOTP({
        tokenType: "reset-password",
        identifierData,
        adminData: { email: normalizedEmail },
      });

      ResJson.success(res, `OTP sent to ${identifierData.identifierType}. ${otp}`, {
        sessionToken,
        expiresAt,
        identifier: identifierData.identifier,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async adminVerifyOtp(req: AdminOTPSessionRequest, res: Response): Promise<void> {
    try {
      const { identifierData, tokenType, adminData } = req.adminSession;
      const { otp } = req.body as TAdminVerifyOtpRequest;

      if (tokenType !== "reset-password") {
        ResJson.unauthenticated(res, "Invalid OTP session token");
        return;
      }

      await OTPService.validateOTP({ identifierData, otp });

      const admin = await AdminModel.findOne({
        email: identifierData.identifier,
        deletedAt: null,
      }).lean();

      if (!admin) {
        ResJson.notFound(res, "Admin not found");
        return;
      }

      const { sessionToken, expiresIn } = TokenService.generateAdminResetToken({
        tokenType: "verify-account",
        identifierData,
        adminData,
      });

      ResJson.success(res, "OTP verified successfully", {
        sessionToken,
        expiresIn,
        user: {
          email: admin.email,
        },
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async adminResendOtp(req: AdminOTPSessionRequest, res: Response): Promise<void> {
    try {
      const { tokenType, identifierData, adminData } = req.adminSession;

      if (tokenType !== "reset-password") {
        ResJson.unauthenticated(res, "Invalid OTP session token");
        return;
      }

      const { otp, expiresAt, sessionToken } = await OTPService.generateAndSendOTP({
        tokenType,
        adminData,
        identifierData,
      });

      ResJson.success(res, `OTP sent to ${identifierData.identifierType}. ${otp}`, {
        sessionToken,
        expiresAt,
        identifier: identifierData.identifier,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async adminResetPassword(req: AdminOTPSessionRequest, res: Response): Promise<void> {
    try {
      const { tokenType, identifierData } = req.adminSession;

      if (tokenType !== "verify-account") {
        ResJson.unauthenticated(res, "Invalid OTP session token");
        return;
      }

      const { newPassword } = req.body as TAdminResetPasswordRequest;

      const admin = await AdminModel.findOne({
        email: identifierData.identifier,
        deletedAt: null,
      });

      if (!admin) {
        ResJson.notFound(res, "Admin not found");
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      admin.password = hashedPassword;
      admin.createdBy = {
        actorType: ActorTypeEnum.ADMIN,
        actorId: admin._id,
      };
      admin.updatedBy = {
        actorType: ActorTypeEnum.ADMIN,
        actorId: admin._id,
      };

      await admin.save();

      ResJson.success(res, "Password updated successfully. Please login again.");
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getAdminProfile(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { adminId } = req.admin;

      const user = await AdminModel.findOne({
        _id: adminId,
        deletedAt: null,
      }).lean();

      if (!user) {
        ResJson.unauthenticated(res, "Authentication failed. User not found.");
        return;
      }

      if (user.status !== StatusEnum.active) {
        ResJson.unauthenticated(res, "Authentication failed. User is not active.");
        return;
      }

      ResJson.success(res, "Auth details retrieved successfully", {
        admin: AdminAuthControllerClass.getAdmin(user),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async validateToken(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { adminId } = req.admin;

      const user = await AdminModel.findOne({
        _id: adminId,
        deletedAt: null,
      }).lean();

      if (!user) {
        ResJson.unauthenticated(res, "Authentication failed. User not found.");
        return;
      }

      if (user.status !== StatusEnum.active) {
        ResJson.unauthenticated(res, "Authentication failed. User is not active.");
        return;
      }

      ResJson.success(res, "Token validated successfully", {
        admin: AdminAuthControllerClass.getAdmin(user),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async updatePassword(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { adminId } = req.admin;
      const { oldPassword, newPassword, confirmedPassword } = req.body;

      const user = await AdminModel.findOne({ _id: adminId, deletedAt: null });

      if (!user) {
        ResJson.notFound(res, "There is no user with this ID");
        return;
      }

      const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
      const isPasswordSame = bcrypt.compareSync(newPassword, user.password);

      if (!isPasswordValid) {
        ResJson.invalid(res, "Old password is incorrect");
        return;
      }

      if (isPasswordSame) {
        ResJson.invalid(res, "Old and new passwords cannot be the same");
        return;
      }

      if (newPassword !== confirmedPassword) {
        ResJson.invalid(res, "New password and confirm password do not match");
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(newPassword, salt);

      user.password = newHash;
      await user.save();

      ResJson.success(res, "Password updated successfully");
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async updateAdminName(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { adminId } = req.admin;
      const { name } = req.body;

      const user = await AdminModel.findOne({
        _id: adminId,
        deletedAt: null,
      });

      if (!user) {
        ResJson.notFound(res, "Admin not found");
        return;
      }

      if (!name || typeof name !== "string") {
        ResJson.invalid(res, "Name is required");
        return;
      }

      user.name = name;
      user.updatedBy = DBHelper.actor(req);

      await user.save();

      ResJson.success(res, "Name updated successfully", {
        admin: AdminAuthControllerClass.getAdmin(user),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async saveNotificationToken(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { adminId } = req.admin;
      const { token, platform } = req.body as TAppUserSaveNotificationRequest;

      await NotificationTokenModel.findOneAndUpdate(
        {
          token,
          userId: adminId,
          userType: ActorTypeEnum.ADMIN,
        },
        {
          userId: adminId,
          userType: ActorTypeEnum.USER,
          token,
          platform,
        },
        { upsert: true }
      );

      ResJson.success(res, "Notification token saved successfully.");
    } catch (error) {
      ResJson.error(res, error);
    }
  }
  async deleteNotificationToken(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { adminId } = req.admin;
      const { token } = req.body as TAppUserDeleteNotificationRequest;
      await NotificationTokenModel.deleteOne({
        token,
        userId: adminId,
        userType: ActorTypeEnum.ADMIN,
      });

      ResJson.success(res, "Notification token deleted successfully.");
    } catch (error) {
      ResJson.error(res, error);
    }
  }
}

export const AdminAuthController = new AdminAuthControllerClass();
