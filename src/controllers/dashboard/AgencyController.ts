import { AgencyModel, type TAgencyModel } from "@database/models/AgencyModel";
import { AgencyTeamModel, type TAgencyTeamModel } from "@database/models/AgencyTeamModel";
import { StatusEnum, VerificationStatusEnum } from "@enum/StatusEnum";
import { DBHelper } from "@utils/db-helpers";
import { ResJson } from "@utils/response-json";
import { StringHelpers } from "@utils/string-helpers";
import type { Request, Response } from "express";
import { getNextSequence } from "@/database/models/CounterModel";
import type {
  TCreateAgencyRequest,
  TDeleteAgencyParams,
  TToggleFeaturedParams,
  TToggleStatusParams,
  TUpdateAgencyParams,
  TUpdateAgencyRequest,
  TUpdateVerificationStatusParams,
  TUpdateVerificationStatusRequest,
} from "@/routes/dashboard/validations/AgencyRouterValidations";
import type { AdminRequest } from "@/types/admin-type";
import { FileHelper } from "@/utils/file-helpers";

class AgencyControllerClass {
  static getAgency(agency: TAgencyModel, agencyTeamMember: TAgencyTeamModel | undefined): Record<string, unknown> {
    return {
      _id: agency._id,
      companyName: agency.companyName,
      cRNumber: agency.cRNumber,
      agencyId: agency.agencyId,
      companyEmail: agency.companyEmail,
      companyPhone: agency.companyPhone,
      companyWhatsapp: agency.companyWhatsapp,
      status: agency.status,
      about: agency.about,
      companyLogo: agency.companyLogo,
      coverImage: agency.coverImage,
      isFeatured: agency.isFeatured,
      verificationStatus: agency.verificationStatus,
      createdAt: agency.createdAt,
      updatedAt: agency.updatedAt,
      createdBy: agency.createdBy,
      email: agencyTeamMember?.email,
      // phone: agencyTeamMember?.phone,
      firstName: agencyTeamMember?.firstName,
      lastName: agencyTeamMember?.lastName,
    };
  }

  async getAllAgencies(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;

      let result = {};

      if (status === "rejected") {
        result = await DBHelper.fetch({
          model: AgencyModel,
          req,
          searchFields: ["companyName", "companyEmail", "companyPhone.phoneNumber", "agencyId"],
          filters: {
            verificationStatus: VerificationStatusEnum.reject,
            deletedAt: null,
          },
          projection: {
            companyName: 1,
            cRNumber: 1,
            companyEmail: 1,
            companyPhone: 1,
            agencyId: 1,
            verificationRejectMessage: 1,
            rejectionHistory: 1,
            createdAt: 1,
            createdBy: 1,
          },
          mapper: (agencies) =>
            agencies.map((agency) => {
              const latestRejection = agency.rejectionHistory?.at(-1);
              return {
                _id: agency._id,
                agencyId: agency.agencyId,
                companyName: agency.companyName,
                cRNumber: agency.cRNumber,
                email: agency.companyEmail,
                firstName: latestRejection?.firstName,
                lastName: latestRejection?.lastName,
                verificationRejectMessage: agency.verificationRejectMessage,
                createdAt: agency.createdAt,
                createdBy: agency.createdBy,
              };
            }),
        });

        return ResJson.success(res, "Agencies list fetched", result);
      }

      const filters = {} as Record<string, unknown>;
      if (status) {
        switch (status) {
          case "pending":
            filters.verificationStatus = VerificationStatusEnum.pending;
            break;
          case "active":
            filters.verificationStatus = VerificationStatusEnum.active;
            break;
          default:
            filters.verificationStatus = VerificationStatusEnum.pending;
            break;
        }
      }

      result = await DBHelper.fetch({
        model: AgencyModel,
        req,
        searchFields: ["companyName", "email", "companyEmail", "companyPhone.phoneNumber", "about", "agencyId"],
        filters,
        lookups: [
          {
            $lookup: {
              from: AgencyTeamModel.collection.name,
              let: { agencyId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$agencyId", "$$agencyId"] },
                    isAdmin: true,
                    deletedAt: null,
                  },
                },
                { $project: { email: 1, firstName: 1, lastName: 1 } },
              ],
              as: "adminTeamMember",
            },
          },
        ],
        projection: {
          companyName: 1,
          companyLogo: 1,
          coverImage: 1,
          about: 1,
          cRNumber: 1,
          companyWhatsapp: 1,
          agencyId: 1,
          adminTeamMember: 1,
          status: 1,
          verificationStatus: 1,
          verificationRejectMessage: 1,
          isFeatured: 1,
          createdAt: 1,
          createdBy: 1,
        },
        mapper: (agencies) =>
          agencies.map((agency) => ({
            _id: agency._id,
            companyLogo: agency.companyLogo,
            coverImage: agency.coverImage,
            companyWhatsapp: agency.companyWhatsapp || null,
            about: agency.about,
            companyName: agency.companyName,
            cRNumber: agency.cRNumber,
            agencyId: agency.agencyId,
            email: agency.adminTeamMember[0]?.email,
            // phone: agency.adminTeamMember[0]?.phone,
            firstName: agency.adminTeamMember[0]?.firstName,
            lastName: agency.adminTeamMember[0]?.lastName,
            status: agency.status,
            verificationStatus: agency.verificationStatus,
            verificationRejectMessage: agency.verificationRejectMessage,
            isFeatured: agency.isFeatured,
            createdAt: agency.createdAt,
            createdBy: agency.createdBy,
          })),
      });

      ResJson.success(res, "Agencies list fetched", result);
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async createAgency(req: AdminRequest, res: Response): Promise<void> {
    const session = await AgencyModel.startSession();
    session.startTransaction();
    try {
      const { firstName, lastName, email, companyPhone, companyLogo, coverImage, about, companyName, companyWhatsapp, cRNumber } = req.body as TCreateAgencyRequest;
      const normalizedEmail = StringHelpers.normalizeEmail(email);
      const normalizedCRN = StringHelpers.normalizeCRN(cRNumber);

      // Check if agency already exists by email or phone
      const existingAgencyMember = await AgencyTeamModel.findOne({
        deletedAt: null,
        $or: [
          { email: normalizedEmail, emailVerifiedAt: { $ne: null } },
          // {
          //   "phone.phoneCode": phone.phoneCode,
          //   "phone.phoneNumber": phone.phoneNumber,
          //   phoneVerifiedAt: { $ne: null },
          // },
        ],
      })
        .session(session)
        .lean();

      if (existingAgencyMember) {
        await session.abortTransaction();
        ResJson.invalid(res, "Agency already registered with this email");
        return;
      }

      let companyLogoPath: string | null = null;
      let coverImagePath: string | null = null;

      if (companyLogo) {
        const uploadResult = FileHelper.uploadFile(companyLogo, {
          folder: "agencies",
          prefix: "companyLogo",
        });

        if (!uploadResult.success) {
          await session.abortTransaction();
          return ResJson.invalid(res, uploadResult.error || "Failed to upload company logo");
        }

        companyLogoPath = uploadResult.filePath ?? null;
      }
      if (coverImage) {
        const uploadResult = FileHelper.uploadFile(coverImage, {
          folder: "agencies",
          prefix: "coverImage",
        });
        if (!uploadResult.success) {
          await session.abortTransaction();
          return ResJson.invalid(res, uploadResult.error || "Failed to upload cover image");
        }
        coverImagePath = uploadResult.filePath ?? null;
      }

      const existingAgency = await AgencyModel.findOne({
        deletedAt: null,
        $or: [{ companyName: { $regex: `^${companyName}$`, $options: "i" } }, { cRNumber: normalizedCRN }],
      })
        .session(session)
        .lean();

      if (existingAgency) {
        await session.abortTransaction();
        ResJson.invalid(res, "Agency already registered with this company name or CR Number");
        return;
      }

      const agencyId = await getNextSequence("agencyId", session);

      const agency = await AgencyModel.create(
        [
          {
            agencyId,
            companyName,
            cRNumber: normalizedCRN,
            companyLogo: companyLogoPath,
            coverImage: coverImagePath,
            about,
            companyWhatsapp,
            companyEmail: email,
            companyPhone,
            deletedAt: null,
            createdBy: DBHelper.actor(req),
            updatedBy: DBHelper.actor(req),
            verifiedAt: new Date(),
            verifiedBy: DBHelper.actor(req),
            verificationStatus: VerificationStatusEnum.active,
          },
        ],
        { session }
      );

      const agencyTeamMember = await AgencyTeamModel.create(
        [
          {
            agencyId: agency[0]._id,
            firstName,
            lastName,
            // phone: {
            //   phoneNumber: phone.phoneNumber,
            //   phoneCode: phone.phoneCode,
            // },
            // phoneVerifiedAt: new Date(),
            email,
            emailVerifiedAt: new Date(),
            status: StatusEnum.active,
            isAdmin: true,
            createdBy: DBHelper.actor(req),
            updatedBy: DBHelper.actor(req),
          },
        ],
        { session }
      );

      await session.commitTransaction();

      ResJson.success(res, "Agency created successfully", {
        agency: AgencyControllerClass.getAgency(agency[0], agencyTeamMember[0]),
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  private static async getApprovedAgencyDetails(agency: TAgencyModel): Promise<Record<string, unknown>> {
    const teams = await AgencyTeamModel.find({
      agencyId: agency._id,
      deletedAt: null,
    }).lean();

    const adminTeam = teams.find((t) => t.isAdmin);

    const response = {
      agency: AgencyControllerClass.getAgency(agency, adminTeam),
      approval: {
        verifiedAt: agency.verifiedAt,
        verifiedBy: agency.verifiedBy,
      },
      rejectionHistory: agency.rejectionHistory || [],
      rejectionCount: agency.rejectionHistory?.length || 0,
      isApproved: true,
    };

    return response;
  }

  private static async getPendingAgencyDetails(agency: TAgencyModel): Promise<Record<string, unknown>> {
    const teams = await AgencyTeamModel.find({
      agencyId: agency._id,
      deletedAt: null,
    }).lean();

    const adminTeam = teams.find((t) => t.isAdmin);

    const response = {
      agency: AgencyControllerClass.getAgency(agency, adminTeam),
      approval: null,
      rejectionHistory: agency.rejectionHistory || [],
      rejectionCount: agency.rejectionHistory?.length || 0,
      isApproved: false,
      isPending: true,
    };

    return response;
  }

  private static async getRejectedAgencyDetails(id: string | string[]): Promise<Record<string, unknown>> {
    const rejectedAgency = await AgencyModel.findOne({
      _id: id,
      deletedAt: null,
      verificationStatus: VerificationStatusEnum.reject,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!rejectedAgency) {
      throw new Error("Agency not found");
    }

    const latestRejection = rejectedAgency.rejectionHistory?.at(-1);

    const response = {
      agency: {
        _id: rejectedAgency._id,
        companyName: rejectedAgency.companyName,
        cRNumber: rejectedAgency.cRNumber,
        agencyId: rejectedAgency.agencyId,
        companyEmail: rejectedAgency.companyEmail,
        companyPhone: rejectedAgency.companyPhone,
        firstName: latestRejection?.firstName,
        lastName: latestRejection?.lastName,
        status: rejectedAgency.status,
        createdAt: rejectedAgency.createdAt,
        createdBy: rejectedAgency.createdBy,
        updatedAt: rejectedAgency.updatedAt,
        verificationStatus: "rejected",
      },
      approval:
        rejectedAgency.verificationStatus === VerificationStatusEnum.active
          ? {
              verifiedAt: rejectedAgency.verifiedAt,
              verifiedBy: rejectedAgency.verifiedBy,
            }
          : null,
      rejectionHistory: rejectedAgency.rejectionHistory || [],
      rejectionCount: rejectedAgency.rejectionHistory?.length || 0,
      isApproved: rejectedAgency.verificationStatus === VerificationStatusEnum.active,
      isPending: false,
    };

    return response;
  }

  async getAgencyDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check for approved agency
      const approvedAgency = await AgencyModel.findOne({
        _id: id,
        deletedAt: null,
        verificationStatus: VerificationStatusEnum.active,
      }).lean();

      if (approvedAgency) {
        const data = await AgencyControllerClass.getApprovedAgencyDetails(approvedAgency);
        ResJson.success(res, "Agency fetched successfully", data);
        return;
      }

      const pendingAgency = await AgencyModel.findOne({
        _id: id,
        deletedAt: null,
        verificationStatus: VerificationStatusEnum.pending,
      }).lean();

      if (pendingAgency) {
        const data = await AgencyControllerClass.getPendingAgencyDetails(pendingAgency);
        ResJson.success(res, "Agency fetched successfully", data);
        return;
      }

      const data = await AgencyControllerClass.getRejectedAgencyDetails(id);

      ResJson.success(res, "Agency fetched successfully", data);
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async updateAgency(req: AdminRequest, res: Response): Promise<void> {
    const session = await AgencyModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TUpdateAgencyParams;
      const { firstName, lastName, companyName, cRNumber, email, companyEmail, companyPhone, companyWhatsapp, companyLogo, coverImage, about } = req.body as TUpdateAgencyRequest;

      const agency = await AgencyModel.findOne({
        _id: id,
        deletedAt: null,
      }).session(session);

      if (!agency) {
        await session.abortTransaction();
        ResJson.notFound(res, "Agency not found");
        return;
      }

      const agencyTeamMembers = await AgencyTeamModel.find({
        agencyId: agency._id,
        deletedAt: null,
      }).session(session);

      const agencyAdminTeamMember = agencyTeamMembers.find((member) => member.isAdmin);

      if (!(agencyTeamMembers && agencyAdminTeamMember)) {
        await session.abortTransaction();
        ResJson.notFound(res, "Agency admin team member not found");
        return;
      }

      const normalizedCRN = StringHelpers.normalizeCRN(cRNumber);

      const existingAgency = await AgencyModel.findOne({
        _id: { $ne: id },
        deletedAt: null,
        $or: [{ companyName: { $regex: `^${companyName}$`, $options: "i" } }, { cRNumber: normalizedCRN }],
      })
        .session(session)
        .lean();

      if (existingAgency) {
        await session.abortTransaction();
        ResJson.invalid(res, "Another agency already registered with this company name or CR Number");
        return;
      }

      const existingTeamMember = await AgencyTeamModel.findOne({
        _id: { $ne: agencyAdminTeamMember._id },
        deletedAt: null,
        $or: [
          { email: StringHelpers.normalizeEmail(email) },
          // {
          //   "phone.phoneNumber": phone.phoneNumber,
          //   "phone.phoneCode": phone.phoneCode,
          // },
        ],
      })
        .session(session)
        .lean();

      if (existingTeamMember) {
        await session.abortTransaction();
        ResJson.invalid(res, "Email or phone number already in use by another agency or team member");
        return;
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

        if (agency.companyLogo) {
          FileHelper.deleteFile(agency.companyLogo);
        }

        agency.companyLogo = uploadResult.filePath;
      } else {
        if (agency.companyLogo) {
          FileHelper.deleteFile(agency.companyLogo);
        }

        agency.companyLogo = null;
      }

      if (coverImage) {
        const uploadResult = FileHelper.uploadFile(coverImage, {
          folder: "agencies",
          prefix: "coverImage",
        });

        if (!uploadResult.success) {
          await session.abortTransaction();
          ResJson.invalid(res, uploadResult.error || "Failed to upload cover image");
          return;
        }

        if (agency.coverImage) {
          FileHelper.deleteFile(agency.coverImage);
        }

        agency.coverImage = uploadResult.filePath;
      } else {
        if (agency.coverImage) {
          FileHelper.deleteFile(agency.coverImage);
        }

        agency.coverImage = null;
      }

      if (about) {
        agency.about = {
          en: about.en ?? agency.about.en,
          ar: about.ar ?? agency.about.ar,
        };
      }

      agency.companyName = companyName;
      agency.companyEmail = companyEmail;

      if (companyPhone) {
        agency.companyPhone = {
          phoneCode: companyPhone.phoneCode ?? agency.companyPhone?.phoneCode,
          phoneNumber: companyPhone.phoneNumber ?? agency.companyPhone?.phoneNumber,
        };
      }

      if (companyWhatsapp) {
        agency.companyWhatsapp = {
          phoneCode: companyPhone?.phoneCode ?? agency.companyWhatsapp.phoneCode,
          phoneNumber: companyPhone?.phoneNumber ?? agency.companyWhatsapp.phoneNumber,
        };
      }
      // agency.companyPhone = companyPhone;

      // agency.companyWhatsapp = companyWhatsapp;
      agency.cRNumber = normalizedCRN;
      agency.updatedBy = DBHelper.actor(req);
      agency.updatedAt = new Date();

      await agency.save({ session });

      agencyAdminTeamMember.firstName = firstName;
      agencyAdminTeamMember.lastName = lastName;
      agencyAdminTeamMember.email = email;
      // agencyAdminTeamMember.phone.phoneNumber = phone.phoneNumber;
      // agencyAdminTeamMember.phone.phoneCode = phone.phoneCode;
      agencyAdminTeamMember.updatedBy = DBHelper.actor(req);
      agencyAdminTeamMember.updatedAt = new Date();

      await agencyAdminTeamMember.save({ session });

      await session.commitTransaction();

      ResJson.success(res, "Agency updated successfully", {
        agency: AgencyControllerClass.getAgency(agency, agencyAdminTeamMember),
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async deleteAgency(req: AdminRequest, res: Response): Promise<void> {
    const session = await AgencyModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TDeleteAgencyParams;

      const agency = await AgencyModel.findOne({
        _id: id,
        deletedAt: null,
      }).session(session);

      if (!agency) {
        await session.abortTransaction();
        ResJson.notFound(res, "Agency not found");
        return;
      }

      // TODO; Check for any dependencies before deleting the agency - properties, packages, etc.

      agency.updatedAt = new Date();
      agency.updatedBy = DBHelper.actor(req);
      agency.deletedAt = new Date();
      agency.deletedBy = DBHelper.actor(req);

      await agency.save({ session });

      await AgencyTeamModel.updateMany(
        { agencyId: agency._id, deletedAt: null },
        {
          $set: {
            deletedAt: new Date(),
            deletedBy: DBHelper.actor(req),
            updatedAt: new Date(),
            updatedBy: DBHelper.actor(req),
          },
        },
        { session }
      );

      await session.commitTransaction();

      ResJson.success(res, "Agency deleted successfully");
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async toggleStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TToggleStatusParams;

      const agency = await AgencyModel.findOne({
        _id: id,
        deletedAt: null,
        verificationStatus: VerificationStatusEnum.active,
      });

      if (!agency) {
        ResJson.notFound(res, "Agency not found or not verified");
        return;
      }

      agency.status = agency.status === StatusEnum.active ? StatusEnum.inactive : StatusEnum.active;
      agency.updatedAt = new Date();
      agency.updatedBy = DBHelper.actor(req);

      await agency.save();

      ResJson.success(res, `Agency ${agency.status === StatusEnum.active ? "activated" : "deactivated"} successfully`, {
        agencyId: agency._id,
        status: agency.status,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async toggleFeatured(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TToggleFeaturedParams;

      const agency = await AgencyModel.findOne({
        _id: id,
        deletedAt: null,
        verificationStatus: VerificationStatusEnum.active,
      });

      if (!agency) {
        ResJson.notFound(res, "Agency not found or not verified");
        return;
      }

      agency.isFeatured = !agency.isFeatured;
      agency.updatedAt = new Date();
      agency.updatedBy = DBHelper.actor(req);

      await agency.save();

      ResJson.success(res, `Agency ${agency.isFeatured ? "featured" : "de-featured"} successfully`, {
        agencyId: agency._id,
        isFeatured: agency.isFeatured,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async updateVerificationStatus(req: AdminRequest, res: Response): Promise<void> {
    const session = await AgencyModel.startSession();
    session.startTransaction();
    try {
      const { id } = req.params as TUpdateVerificationStatusParams;

      const { status, remarks } = req.body as TUpdateVerificationStatusRequest;

      if (status === "reject" && !remarks) {
        return ResJson.invalid(res, "Remarks are required when rejecting an agency");
      }

      const agency = await AgencyModel.findOne({
        _id: id,
        deletedAt: null,
        verificationStatus: VerificationStatusEnum.pending,
      }).session(session);

      if (!agency) {
        return ResJson.notFound(res, "Agency not found");
      }

      if (status === "accept") {
        agency.verificationStatus = VerificationStatusEnum.active;
        agency.verifiedAt = new Date();
        agency.verifiedBy = DBHelper.actor(req);
        agency.verificationRejectMessage = null;
      }

      if (status === "reject") {
        const agencyMember = await AgencyTeamModel.findOne({
          isAdmin: true,
          agencyId: agency._id,
          email: agency.companyEmail,
        }).session(session);

        agency.rejectionHistory.push({
          companyName: agency.companyName,
          cRNumber: agency.cRNumber,
          companyEmail: agency.companyEmail,
          companyPhone: agency.companyPhone,
          firstName: agencyMember?.firstName,
          lastName: agencyMember?.lastName,
          emailVerifiedAt: agencyMember?.emailVerifiedAt,
          verificationRejectMessage: remarks,
          rejectedBy: DBHelper.actor(req),
          rejectedAt: new Date(),
        });

        agency.verificationStatus = VerificationStatusEnum.reject;
        agency.verificationRejectMessage = remarks;

        await AgencyTeamModel.updateMany(
          { agencyId: agency._id },
          {
            $set: {
              verificationStatus: VerificationStatusEnum.reject,
              updatedAt: new Date(),
              updatedBy: DBHelper.actor(req),
            },
          },
          { session }
        );
      }

      agency.updatedAt = new Date();
      agency.updatedBy = DBHelper.actor(req);

      await agency.save({ session });

      await session.commitTransaction();
      session.endSession();

      return ResJson.success(res, "Agency verification status updated successfully", {
        agencyId: agency._id,
        verificationStatus: agency.verificationStatus,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return ResJson.error(res, error);
    }
  }
}
export const AgencyController = new AgencyControllerClass();
