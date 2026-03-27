import { OTPSourceEnum } from "@enum/OTPSourceEnum";
import { FileHelper } from "@utils/file-helpers";
import { ResJson } from "@utils/response-json";
import { StringHelpers } from "@utils/string-helpers";
import type { Request, Response } from "express";
import type mongoose from "mongoose";
import { getNextSequence } from "@/database/models/CounterModel";
import { PropertyModel, type TPropertyModel } from "@/database/models/PropertyModel";
import { type TUserModel, UserModel } from "@/database/models/UserModel";
import { OwnerTypeEnum } from "@/enum/OwnerTypeEnum";
import { PropertyPurposeEnum } from "@/enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TWebUserRegisterRequest, TWebUserRequestOtpRequest, TWebUserUpdateProfileRequest } from "@/routes/website/user/validations/UserAuthRouterValidation";
import { OTPService } from "@/services/OTPService";
import { TokenService } from "@/services/TokenService";
import type { TIdentifierData } from "@/types";
import type { UserOTPSessionRequest, UserProfileOTPSessionRequest, UserRequest } from "@/types/user-type";

class WebUserAuthControllerClass {
  static getUser(user: TUserModel, properties: TPropertyModel[] = []): Record<string, unknown> {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: {
        phoneCode: user.phone?.phoneCode,
        phoneNumber: user.phone?.phoneNumber,
      },
      logo: FileHelper.getUrl(user.logo),
      isProfileCompleted: user.isProfileCompleted,
      status: user.status,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
      // phoneVerifiedAt: user.phoneVerifiedAt,
      activeProperties: properties.length,
      forSell: properties.filter((property) => property.purpose === PropertyPurposeEnum.Sell).length,
      forRent: properties.filter((property) => property.purpose === PropertyPurposeEnum.Rent).length,
    };
  }

  static getUserProperties(userId: mongoose.Types.ObjectId): Promise<TPropertyModel[]> {
    return PropertyModel.find({
      "owner.ownerType": OwnerTypeEnum.user,
      "owner.ownerId": userId,
      verificationStatus: VerificationStatusEnum.active,
      status: StatusEnum.active,
    })
      .select({ _id: 1, purpose: 1 })
      .lean();
  }

  async userRegister(req: Request, res: Response): Promise<void> {
    try {
      const { firstName,phone, lastName, email } = req.body as TWebUserRegisterRequest;

      const normalizedEmail = StringHelpers.normalizeEmail(email);

      const existingUser = await UserModel.findOne({
        deletedAt: null,
        $or: [
          { email: normalizedEmail, emailVerifiedAt: { $ne: null } },
          // { "phone.phoneCode": phone.phoneCode, "phone.phoneNumber": phone.phoneNumber, phoneVerifiedAt: { $ne: null } },
        ],
      });

      if (existingUser) {
        ResJson.invalid(res, "User already registered with this email.");
        return;
      }

      const userData = {
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
      };

      const identifierData: TIdentifierData = {
        identifier: normalizedEmail,
        identifierType: "email",
        source: OTPSourceEnum.userWeb,
      };

      const { sessionToken, expiresAt, otp } = await OTPService.generateAndSendOTP({
        tokenType: "register",
        userData,
        identifierData,
      });

      return ResJson.success(res, `OTP has been sent to ${identifierData.identifierType}. ${otp}`, {
        sessionToken,
        expiresAt,
        identifier: identifierData.identifier,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async userRequestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body as TWebUserRequestOtpRequest;

      if (!email) {
        ResJson.invalid(res, "Email not verified.");
      }

      let identifierData: TIdentifierData | null = null;

      // if (phone) {
      //   const existingUser = await UserModel.findOne({
      //     deletedAt: null,
      //     "phone.phoneCode": phone.phoneCode,
      //     "phone.phoneNumber": phone.phoneNumber,
      //     phoneVerifiedAt: { $ne: null },
      //   });

      //   if (!existingUser) {
      //     ResJson.invalid(res, "User not found or phone number not verified.");
      //     return;
      //   }

      //   if (existingUser.status !== StatusEnum.active) {
      //     ResJson.invalid(res, "User account is not active.");
      //     return;
      //   }

      //   const normalizedPhone = StringHelpers.normalizePhone(phone);

      //   identifierData = {
      //     identifier: normalizedPhone,
      //     identifierType: "phone",
      //     source: OTPSourceEnum.userWeb,
      //   };
      // }

      if (email) {
        const normalizedEmail = StringHelpers.normalizeEmail(email);

        const existingUser = await UserModel.findOne({
          deletedAt: null,
          email: normalizedEmail,
          emailVerifiedAt: { $ne: null },
        });

        if (!existingUser) {
          ResJson.invalid(res, "User not found or email not verified.");
          return;
        }

        if (existingUser.status !== StatusEnum.active) {
          ResJson.invalid(res, "User account is not active.");
          return;
        }

        identifierData = {
          identifier: normalizedEmail,
          identifierType: "email",
          source: OTPSourceEnum.userWeb,
        };
      }

      if (!identifierData) {
        ResJson.invalid(res, "Email is required to request OTP");
        return;
      }

      const { sessionToken, expiresAt, otp } = await OTPService.generateAndSendOTP({
        tokenType: "login",
        identifierData,
      });

      ResJson.success(res, `OTP sent to ${identifierData.identifierType}. ${otp}`, {
        sessionToken,
        expiresAt,
        identifier: identifierData.identifier,
      });
      return;
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async userVerifyOtp(req: UserOTPSessionRequest, res: Response): Promise<void> {
    const session = await UserModel.startSession();
    session.startTransaction();

    try {
      const { tokenType, userData, identifierData } = req.userSession;
      const { otp } = req.body;

      await OTPService.validateOTP({ identifierData, otp });

      if (tokenType === "register" && userData) {
        const userId = await getNextSequence("userId", session);
        const user = await UserModel.create(
          [
            {
              userId,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phone: userData.phone,
              // phoneVerifiedAt: identifierData.identifierType === "phone" ? new Date() : null,
              emailVerifiedAt: identifierData.identifierType === "email" ? new Date() : null,
              status: StatusEnum.active,
            },
          ],
          { session }
        );

        await session.commitTransaction();

        const { accessToken, expiresIn } = TokenService.generateUserToken({
          userId: user[0]._id,
          identifier: identifierData,
        });

        ResJson.success(res, "User registered successfully", {
          accessToken,
          expiresIn,
          user: WebUserAuthControllerClass.getUser(user[0]),
        });

        return;
      }

      if (tokenType === "login") {
        await session.abortTransaction();

        let matcher = {} as Record<string, unknown>;
        if (identifierData.identifierType === "email") {
          matcher = { email: identifierData.identifier, emailVerifiedAt: { $ne: null } };
        }
        // else {
        //   const { phoneCode, phoneNumber } = StringHelpers.splitPhone(identifierData.identifier);
        //   matcher = { "phone.phoneCode": phoneCode, "phone.phoneNumber": phoneNumber, phoneVerifiedAt: { $ne: null } };
        // }

        const user = await UserModel.findOne({
          ...matcher,
          deletedAt: null,
        }).lean();

        if (!user) {
          ResJson.invalid(res, "User not found or not verified");
          return;
        }

        if (user.status !== StatusEnum.active) {
          ResJson.invalid(res, "User account is not active");
          return;
        }

        const { accessToken, expiresIn } = TokenService.generateUserToken({
          userId: user._id,
          identifier: identifierData,
        });

        ResJson.success(res, "OTP verified successfully", {
          accessToken,
          expiresIn,
          user: WebUserAuthControllerClass.getUser(user),
        });

        return;
      }

      await session.abortTransaction();
      ResJson.unauthenticated(res, "Invalid OTP session token");
      return;
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async userResendOtp(req: UserOTPSessionRequest, res: Response): Promise<void> {
    try {
      const { tokenType, userData, identifierData } = req.userSession;

      const { otp, expiresAt, sessionToken } = await OTPService.generateAndSendOTP({
        tokenType,
        userData,
        identifierData,
      });

      ResJson.success(res, `OTP resent to ${identifierData.identifierType}. ${otp}`, {
        sessionToken,
        expiresAt,
        identifier: identifierData.identifier,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getUserProfile(req: UserRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user;
      const user = await UserModel.findOne({ _id: userId, deletedAt: null }).lean();

      if (!user) {
        ResJson.notFound(res, "User not found.");
        return;
      }

      const properties = await WebUserAuthControllerClass.getUserProperties(user._id);

      ResJson.success(res, "User profile retrieved successfully", {
        user: WebUserAuthControllerClass.getUser(user, properties),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async updateProfile(req: UserRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user;
      const { firstName, lastName, logo } = req.body as TWebUserUpdateProfileRequest;

      const user = await UserModel.findOne({ _id: userId, deletedAt: null });

      if (!user) {
        ResJson.notFound(res, "User not found.");
        return;
      }

      if (firstName) {
        user.firstName = firstName;
      }

      if (lastName) {
        user.lastName = lastName;
      }

      if (logo) {
        const uploadResult = FileHelper.uploadFile(logo, {
          folder: "users",
          prefix: "logo",
        });

        if (!uploadResult.success) {
          ResJson.invalid(res, uploadResult.error || "Failed to upload logo");
          return;
        }

        if (user.logo) {
          FileHelper.deleteFile(user.logo);
        }

        user.logo = uploadResult.filePath;
        user.isProfileCompleted = new Date();
      }

      await user.save();

      ResJson.success(res, "Profile updated successfully", {
        user: WebUserAuthControllerClass.getUser(user),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  // async requestPhoneNumberChange(req: UserRequest, res: Response): Promise<void> {
  //   try {
  //     const { userId } = req.user;
  //     const { newPhoneNumber } = req.body as { newPhoneNumber: string };

  //     const user = await UserModel.findOne({ _id: userId, deletedAt: null });

  //     if (!user) {
  //       ResJson.notFound(res, "User not found.");
  //       return;
  //     }

  //     const normalizedNewPhone = StringHelpers.normalizePhone({ phoneCode: env.DEFAULT_PHONE_CODE, phoneNumber: newPhoneNumber });

  //     if (StringHelpers.normalizePhone(user.phone) === normalizedNewPhone) {
  //       ResJson.invalid(res, "The new phone number must be different from the current one.");
  //       return;
  //     }

  //     const existingUser = await UserModel.findOne({
  //       deletedAt: null,
  //       "phone.phoneCode": env.DEFAULT_PHONE_CODE,
  //       "phone.phoneNumber": newPhoneNumber,
  //       phoneVerifiedAt: { $ne: null },
  //     });

  //     if (existingUser) {
  //       ResJson.invalid(res, "The new phone number is already in use by another account.");
  //       return;
  //     }

  //     const identifierData: TIdentifierData = {
  //       identifier: normalizedNewPhone,
  //       identifierType: "phone",
  //       source: OTPSourceEnum.userWeb,
  //     };

  //     const { sessionToken, expiresAt, otp } = await OTPService.generateAndSendOTP({
  //       tokenType: "change",
  //       identifierData,
  //     });

  //     ResJson.success(res, `OTP sent to ${identifierData.identifierType}. ${otp}`, {
  //       sessionToken,
  //       expiresAt,
  //       identifier: identifierData.identifier,
  //     });
  //   } catch (error) {
  //     ResJson.error(res, error);
  //   }
  // }

  // async verifyPhoneNumberChange(req: UserProfileOTPSessionRequest, res: Response): Promise<void> {
  //   const session = await UserModel.startSession();
  //   session.startTransaction();

  //   try {
  //     const { userId } = req.user;
  //     const { tokenType, identifierData } = req.userSession;
  //     const { otp } = req.body;

  //     if (tokenType !== "change" || identifierData.identifierType !== "phone") {
  //       ResJson.invalid(res, "Invalid token type for phone number change.");
  //       return;
  //     }

  //     await OTPService.validateOTP({ identifierData, otp });

  //     const user = await UserModel.findOne({ _id: userId, deletedAt: null }).session(session);

  //     if (!user) {
  //       ResJson.notFound(res, "User not found.");
  //       return;
  //     }

  //     const { phoneCode, phoneNumber } = StringHelpers.splitPhone(identifierData.identifier);

  //     user.phone = {
  //       phoneCode,
  //       phoneNumber,
  //     };
  //     user.phoneVerifiedAt = new Date();

  //     await user.save();

  //     await session.commitTransaction();

  //     ResJson.success(res, "Phone number updated successfully", {
  //       user: WebUserAuthControllerClass.getUser(user),
  //     });
  //   } catch (error) {
  //     await session.abortTransaction();
  //     ResJson.error(res, error);
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async requestEmailChange(req: UserRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user;
      const { newEmail } = req.body as { newEmail: string };

      const user = await UserModel.findOne({ _id: userId, deletedAt: null });

      if (!user) {
        ResJson.notFound(res, "User not found.");
        return;
      }

      const normalizedNewEmail = StringHelpers.normalizeEmail(newEmail);

      if (user.email === normalizedNewEmail) {
        ResJson.invalid(res, "The new email must be different from the current one.");
        return;
      }

      const existingUser = await UserModel.findOne({
        deletedAt: null,
        email: normalizedNewEmail,
        emailVerifiedAt: { $ne: null },
      });

      if (existingUser) {
        ResJson.invalid(res, "The new email is already in use by another account.");
        return;
      }

      const identifierData: TIdentifierData = {
        identifier: normalizedNewEmail,
        identifierType: "email",
        source: OTPSourceEnum.userWeb,
      };

      const { sessionToken, expiresAt, otp } = await OTPService.generateAndSendOTP({
        tokenType: "change",
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

  async verifyEmailChange(req: UserProfileOTPSessionRequest, res: Response): Promise<void> {
    const session = await UserModel.startSession();
    session.startTransaction();

    try {
      const { userId } = req.user;
      const { tokenType, identifierData } = req.userSession;
      const { otp } = req.body;

      if (tokenType !== "change" || identifierData.identifierType !== "email") {
        ResJson.invalid(res, "Invalid token type for email change.");
        return;
      }

      await OTPService.validateOTP({ identifierData, otp });

      const user = await UserModel.findOne({ _id: userId, deletedAt: null }).session(session);

      if (!user) {
        ResJson.notFound(res, "User not found.");
        return;
      }

      user.email = identifierData.identifier;
      user.emailVerifiedAt = new Date();

      await user.save();

      await session.commitTransaction();

      ResJson.success(res, "Email updated successfully", {
        user: WebUserAuthControllerClass.getUser(user),
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }
}

export const WebUserAuthController = new WebUserAuthControllerClass();
