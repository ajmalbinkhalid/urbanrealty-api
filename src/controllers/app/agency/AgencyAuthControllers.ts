import { OTPSourceEnum } from "@enum/OTPSourceEnum";
import { ResJson } from "@utils/response-json";
import { StringHelpers } from "@utils/string-helpers";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { AgencyModel, type TAgencyModel } from "@/database/models/AgencyModel";
import { AgencyTeamModel, type TAgencyTeamModel } from "@/database/models/AgencyTeamModel";
import { getNextSequence } from "@/database/models/CounterModel";
import { NotificationTokenModel } from "@/database/models/NotificationTokenModel";
import { ActorTypeEnum } from "@/enum/actor-type-enum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TAppAgencyDeleteNotificationRequest, TAppAgencyRegisterRequest, TAppAgencyRequestOtpRequest, TAppAgencySaveNotificationRequest, TAppAgencyUpdateProfileRequest } from "@/routes/app/agency/validations/AgencyAuthRouterValidation";
import { OTPService } from "@/services/OTPService";
import { TokenService } from "@/services/TokenService";
import type { TIdentifierData } from "@/types";
import type { AgencyOTPSessionRequest, AgencyRequest } from "@/types/agency-type";
import { FileHelper } from "@/utils/file-helpers";

class AppAgencyAuthControllerClass {
  static getAgency(agency: TAgencyModel): Record<string, unknown> {
    return {
      id: agency._id,
      agencyId: agency.agencyId,
      companyName: agency.companyName,
      cRNumber: agency.cRNumber,
      companyLogo: FileHelper.getUrl(agency.companyLogo),
      companyEmail: agency.companyEmail,
      companyPhone: {
        phoneCode: agency.companyPhone?.phoneCode,
        phoneNumber: agency.companyPhone?.phoneNumber,
      },
      companyWhatsapp: agency.companyWhatsapp
        ? {
            phoneCode: agency.companyWhatsapp.phoneCode,
            phoneNumber: agency.companyWhatsapp.phoneNumber,
          }
        : null,
      forRent: agency.activeRentPropertiesCount,
      forSell: agency.activeSalePropertiesCount,
      activeProperties: agency.activeSalePropertiesCount + agency.activeRentPropertiesCount,
      about: agency.about,
      isFeatured: agency.isFeatured,
      verificationStatus: agency.verificationStatus,
      remarks: agency.verificationRejectMessage,
      locationId: agency.locationId,
      status: agency.status,
      createdAt: agency.createdAt,
      updatedAt: agency.updatedAt,
    };
  }

  static getAgencyTeamMember(agencyTeamMember: TAgencyTeamModel): Record<string, unknown> {
    return {
      id: agencyTeamMember._id,
      firstName: agencyTeamMember.firstName,
      lastName: agencyTeamMember.lastName,
      email: agencyTeamMember.email,
      phone: {
        phoneCode: agencyTeamMember.phone?.phoneCode,
        phoneNumber: agencyTeamMember.phone?.phoneNumber,
      },
      role: agencyTeamMember.isAdmin ? "admin" : "member",
      status: agencyTeamMember.status,
      createdAt: agencyTeamMember.createdAt,
      updatedAt: agencyTeamMember.updatedAt,
    };
  }

  async agencyRegister(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, phone, email, company, cRNumber } = req.body as TAppAgencyRegisterRequest;

      const normalizedEmail = StringHelpers.normalizeEmail(email);
      const normalizedCRN = StringHelpers.normalizeCRN(cRNumber);

      const existingAgencyMember = await AgencyTeamModel.findOne({
        deletedAt: null,
        $or: [
          { email: normalizedEmail, emailVerifiedAt: { $ne: null } },
          // { "phone.phoneCode": phone.phoneCode, "phone.phoneNumber": phone.phoneNumber, phoneVerifiedAt: { $ne: null } },
        ],
      });

      if (existingAgencyMember) {
        ResJson.invalid(res, "Agency already registered with this email");
        return;
      }

      const existingAgency = await AgencyModel.findOne({
        deletedAt: null,
        $or: [{ companyName: { $regex: `^${company}$`, $options: "i" } }, { cRNumber: normalizedCRN }],
      });

      if (existingAgency) {
        ResJson.invalid(res, "Agency already registered with this company name or CR Number");
        return;
      }

      const agencyData = {
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        company,
        cRNumber: normalizedCRN,
      };

      const identifierData: TIdentifierData = {
        identifier: normalizedEmail,
        identifierType: "email",
        source: OTPSourceEnum.agencyApp,
      };

      const { sessionToken, expiresAt, otp } = await OTPService.generateAndSendOTP({
        tokenType: "register",
        agencyData,
        identifierData,
      });

      return ResJson.success(res, `OTP has been sent to ${identifierData.identifierType}. ${otp}`, {
        sessionToken,
        expiresAt,
        identifier: identifierData.identifier,
      });
    } catch (error) {
      ResJson.error(res, error);
      return;
    }
  }

  async agencyRequestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body as TAppAgencyRequestOtpRequest;

      if (!email) {
        ResJson.invalid(res, "Email is required");
      }

      const agencyTeamFilter = { deletedAt: null } as unknown as Record<string, unknown>;

      // if (phone) {
      //   agencyTeamFilter["phone.phoneCode"] = phone.phoneCode;
      //   agencyTeamFilter["phone.phoneNumber"] = phone.phoneNumber;

      //   agencyTeamFilter.phoneVerifiedAt = { $ne: null };
      // }

      agencyTeamFilter.email = StringHelpers.normalizeEmail(email);
      agencyTeamFilter.emailVerifiedAt = { $ne: null };

      const existingAgencyTeam = await AgencyTeamModel.findOne(agencyTeamFilter).lean();

      if (!existingAgencyTeam) {
        ResJson.invalid(res, "Agency team member not found or not verified");
        return;
      }

      if (existingAgencyTeam.status !== StatusEnum.active) {
        ResJson.invalid(res, "Agency team member account is not active");
        return;
      }

      const agency = await AgencyModel.findOne({ _id: existingAgencyTeam.agencyId, deletedAt: null }).lean();

      if (!agency) {
        ResJson.notFound(res, "Agency not found or not verified");
        return;
      }

      const identifierData: TIdentifierData = {
        identifier: StringHelpers.normalizeEmail(email ?? ""),
        identifierType: "email",
        source: OTPSourceEnum.agencyApp,
      };

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

  async agencyVerifyOtp(req: AgencyOTPSessionRequest, res: Response): Promise<void> {
    try {
      const { tokenType, agencyData, identifierData } = req.agencySession;
      const { otp } = req.body;

      await OTPService.validateOTP({ identifierData, otp });

      if (tokenType === "register" && agencyData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const agencyId = await getNextSequence("agencyId", session);
          const agency = await AgencyModel.create(
            [
              {
                agencyId,
                companyName: agencyData.company,
                cRNumber: agencyData.cRNumber,
                companyEmail: agencyData.email,
                companyPhone: agencyData.phone,
                companyWhatsapp: agencyData.phone,
              },
            ],
            { session }
          );

          await AgencyTeamModel.create(
            [
              {
                agencyId: agency[0]._id,
                firstName: agencyData.firstName,
                lastName: agencyData.lastName,
                email: agencyData.email,
                isAdmin: true,
                phone: agencyData.phone,
                verificationStatus: VerificationStatusEnum.pending,
                // phoneVerifiedAt: identifierData.identifierType === "phone" ? new Date() : null,
                emailVerifiedAt: identifierData.identifierType === "email" ? new Date() : null,
              },
            ],
            { session }
          );

          await session.commitTransaction();

          ResJson.success(res, "Agency registered successfully", {
            agency: {
              agencyId: agency[0].agencyId,
              email: agencyData.email,
              phone: StringHelpers.normalizePhone(agencyData.phone),
            },
          });

          return;
        } catch (error) {
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }
      }

      if (tokenType === "login") {
        let matcher = {} as Record<string, unknown>;

        if (identifierData.identifierType === "email") {
          matcher = { email: identifierData.identifier, emailVerifiedAt: { $ne: null } };
        }
        // else {
        //   const { phoneCode, phoneNumber } = StringHelpers.splitPhone(identifierData.identifier);
        //   matcher = { "phone.phoneCode": phoneCode, "phone.phoneNumber": phoneNumber, phoneVerifiedAt: { $ne: null } };
        // }

        const agencyTeam = await AgencyTeamModel.findOne({
          ...matcher,
          deletedAt: null,
        }).lean();

        if (!agencyTeam) {
          ResJson.unauthenticated(res, "Agency team member not found or not verified");
          return;
        }

        if (agencyTeam.status !== StatusEnum.active) {
          ResJson.invalid(res, "Agency team member account is not active");
          return;
        }

        const agency = await AgencyModel.findOne({
          _id: agencyTeam.agencyId,
          deletedAt: null,
        }).lean();

        if (!agency) {
          ResJson.unauthenticated(res, "Agency not found or not verified");
          return;
        }

        const { accessToken, expiresIn } = TokenService.generateAgencyToken({
          agencyId: agency._id,
          agencyTeamId: agencyTeam._id,
          role: agencyTeam.isAdmin ? "admin" : "member",
          identifier: identifierData,
        });

        ResJson.success(res, "OTP verified successfully", {
          accessToken,
          expiresIn,
          agency: AppAgencyAuthControllerClass.getAgency(agency),
          remarks: agency.verificationRejectMessage,
          agencyTeam: AppAgencyAuthControllerClass.getAgencyTeamMember(agencyTeam),
        });

        return;
      }

      ResJson.unauthenticated(res, "Invalid OTP session token");
      return;
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async agencyResendOtp(req: AgencyOTPSessionRequest, res: Response): Promise<void> {
    try {
      const { tokenType, agencyData, identifierData } = req.agencySession;

      const { otp, expiresAt, sessionToken } = await OTPService.generateAndSendOTP({
        tokenType,
        agencyData,
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

  async getAgencyProfile(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const { agencyId, agencyTeamId } = req.agency;
      const agency = await AgencyModel.findOne({ _id: agencyId, deletedAt: null }).lean();
      const agencyTeam = await AgencyTeamModel.findOne({ _id: agencyTeamId, deletedAt: null }).lean();

      if (!(agency && agencyTeam)) {
        ResJson.notFound(res, "Agency not found.");
        return;
      }

      ResJson.success(res, "Agency profile retrieved successfully", {
        agency: AppAgencyAuthControllerClass.getAgency(agency),
        agencyTeam: AppAgencyAuthControllerClass.getAgencyTeamMember(agencyTeam),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async updateAgencyProfile(req: AgencyRequest, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { agencyId, agencyTeamId } = req.agency;

      const { companyLogo, companyName, cRNumber, companyEmail, companyPhone, companyWhatsapp, about, firstName, lastName } = req.body as TAppAgencyUpdateProfileRequest;

      const updatedAgency = await AgencyModel.findOne({ _id: agencyId, deletedAt: null }).session(session);

      if (!updatedAgency) {
        await session.abortTransaction();
        ResJson.notFound(res, "Agency not found.");
        return;
      }

      if (companyName) {
        updatedAgency.companyName = companyName;
      }

      if (companyEmail) {
        updatedAgency.companyEmail = companyEmail;
      }

      if (cRNumber) {
        updatedAgency.cRNumber = cRNumber;
      }

      if (companyPhone) {
        updatedAgency.companyPhone = companyPhone;
      }

      if (companyWhatsapp !== undefined) {
        updatedAgency.companyWhatsapp = companyWhatsapp || null;
      }

      if (companyLogo) {
        const uploadResult = FileHelper.uploadFile(companyLogo, {
          folder: "agencies",
          prefix: "logo",
        });

        if (!uploadResult.success) {
          await session.abortTransaction();
          ResJson.invalid(res, uploadResult.error || "Failed to upload logo");
          return;
        }

        if (updatedAgency.companyLogo) {
          FileHelper.deleteFile(updatedAgency.companyLogo);
        }

        updatedAgency.companyLogo = uploadResult.filePath;
      }

      if (about) {
        updatedAgency.about = {
          en: about.en ?? updatedAgency.about.en,
          ar: about.ar ?? updatedAgency.about.ar,
        };
      }

      await updatedAgency.save({ session });

      // Update Agency Team Member
      const teamUpdate: Partial<TAgencyTeamModel> = {
        updatedAt: new Date(),
        updatedBy: null,
      };

      if (firstName) {
        teamUpdate.firstName = firstName;
      }
      if (lastName) {
        teamUpdate.lastName = lastName;
      }

      const updatedAgencyTeam = await AgencyTeamModel.findOneAndUpdate({ _id: agencyTeamId, deletedAt: null }, teamUpdate, { new: true, lean: true, session });

      if (!updatedAgencyTeam) {
        await session.abortTransaction();
        ResJson.notFound(res, "Agency team member not found.");
        return;
      }

      await session.commitTransaction();
      session.endSession();

      ResJson.success(res, "Profile updated successfully", {
        agency: AppAgencyAuthControllerClass.getAgency(updatedAgency),
        agencyTeam: AppAgencyAuthControllerClass.getAgencyTeamMember(updatedAgencyTeam),
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      ResJson.error(res, error);
    }
  }

  async saveNotificationToken(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const { agencyId } = req.agency;
      const { token, platform } = req.body as TAppAgencySaveNotificationRequest;

      await NotificationTokenModel.findOneAndUpdate(
        {
          token,
          agencyId,
          userType: ActorTypeEnum.AGENCY_MEMBER,
        },
        {
          agencyId,
          userType: ActorTypeEnum.AGENCY_MEMBER,
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

  async deleteNotificationToken(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const { agencyId } = req.agency;
      const { token } = req.body as TAppAgencyDeleteNotificationRequest;

      await NotificationTokenModel.deleteOne({
        token,
        agencyId,
        userType: ActorTypeEnum.AGENCY_MEMBER,
      });

      ResJson.success(res, "Notification token deleted successfully.");
    } catch (error) {
      ResJson.error(res, error);
    }
  }
}

export const AppAgencyAuthController = new AppAgencyAuthControllerClass();
