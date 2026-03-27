import type { Response } from "express";
import mongoose from "mongoose";
import { AgencyModel } from "@/database/models/AgencyModel";
import { AgencyTeamModel } from "@/database/models/AgencyTeamModel";
import { AmenityModel } from "@/database/models/AmenitiesModel";
import { LocationModel } from "@/database/models/LocationModel";
import { PackageModel } from "@/database/models/PackageModel";
import { SubCategoryModel } from "@/database/models/SubCategoryModel";
import { PackageSubsciptionTypeEnum, PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TWebAgencyResubmitApplicationRequest } from "@/routes/website/agency/validations/AgencyAuthRouterValidation";
import type { AgencyRequest } from "@/types/agency-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";
import { StringHelpers } from "@/utils/string-helpers";

class WebAgencyControllerClass {
  async getLocations(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const locations = await LocationModel.aggregate([
        {
          $match: {
            status: StatusEnum.active,
            deletedAt: null,
          },
        },
        {
          $project: {
            _id: 1,
            name: DBHelper.locale(req, "$city"),
          },
        },
      ]);

      ResJson.success(res, "Location fetch successful", { locations });
      return;
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getAmenities(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const amenities = await AmenityModel.aggregate([
        {
          $match: {
            status: StatusEnum.active,
            deletedAt: null,
          },
        },
        {
          $project: {
            _id: 1,
            icon: DBHelper.file("$icon"),
            name: DBHelper.locale(req, "$name"),
          },
        },
      ]);

      ResJson.success(res, "Amenities fetched successfully", { amenities });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getSubCategories(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const { categoryId } = req.query;

      const filters = {
        status: StatusEnum.active,
        deletedAt: null,
      } as Record<string, unknown>;

      if (categoryId) {
        filters.propertyCategoryId = Number(categoryId);
      }

      const subCategories = await SubCategoryModel.aggregate([
        {
          $match: filters,
        },
        {
          $project: {
            _id: 1,
            subCategoryId: 1,
            propertyCategoryId: 1,
            name: DBHelper.locale(req, "$name"),
          },
        },
      ]);

      ResJson.success(res, "Sub categories fetched successfully", { subCategories });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getAllPackages(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query as { type?: string; locale?: string };

      const filters: Record<string, unknown> = {
        userType: UserTypeEnum.Agent,
        deletedAt: null,
      };

      if (Number(type) === PackageTypeEnum.Subscription) {
        filters.type = PackageTypeEnum.Subscription;
      }

      if (Number(type) === PackageTypeEnum.Promotion) {
        filters.type = PackageTypeEnum.Promotion;
        filters.noOfProperties = null;
        filters.flatPrice = null;
      }

      const pipeline = [
        { $match: filters },
        {
          $project: {
            _id: 1,
            subscriptionId: 1,
            name: DBHelper.locale(req, "$name"),
            offerText: 1,
            subscriptionType: 1,
            type: 1,
            userType: 1,
            status: 1,
            price: 1,
            flatPrice: 1,
            noOfProperties: 1,
            noOfFeaturedProperty: 1,
            validity: 1,
            createdAt: 1,
            createdBy: 1,
          },
        },
      ];

      const dbPackages = await PackageModel.aggregate(pipeline);

      const packagesList = dbPackages
        .map((pkg) => {
          const flatPrice = pkg.flatPrice === 0 ? null : (pkg.flatPrice ?? null);
          const noOfFeaturedProperty = pkg.noOfFeaturedProperty === 0 ? null : (pkg.noOfFeaturedProperty ?? null);

          const base = {
            _id: pkg._id ?? null,
            subscriptionId: pkg.subscriptionId ?? null,
            name: pkg.name ?? null,
            subscriptionType: pkg.subscriptionType,
            type: pkg.type,
            userType: pkg.userType,
            status: pkg.status,
            price: pkg.price ?? null,
            noOfFeaturedProperty,
            validity: pkg.validity ?? null,
            createdAt: pkg.createdAt ?? null,
            createdBy: pkg.createdBy ?? null,
          };
          if (Number(type) === PackageTypeEnum.Promotion) {
            // Omit flatPrice, offerText, noOfProperties for Promotion
            return base;
          }
          return {
            ...base,
            offerText: pkg.offerText ?? null,
            flatPrice,
            noOfProperties: pkg.noOfProperties ?? null,
          };
        })
        .filter((pkg) => pkg.userType === UserTypeEnum.Agent);

      let finalResult;

      // Separate free and non-free packages
      const freePackages = packagesList.filter((pkg) => Number(pkg.subscriptionType) === PackageSubsciptionTypeEnum.Free);
      const nonFreePackages = packagesList.filter((pkg) => Number(pkg.subscriptionType) !== PackageSubsciptionTypeEnum.Free);

      if (Number(type) === PackageTypeEnum.Promotion) {
        const filteredNonFree = nonFreePackages.filter((pkg) => Number(pkg.subscriptionType) !== PackageSubsciptionTypeEnum.Custom);
        finalResult = filteredNonFree;
      } else {
        // For subscriptions: free packages first, then non-free packages
        finalResult = [...freePackages, ...nonFreePackages];
      }

      return ResJson.success(res, "Packages fetched successfully", finalResult);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async resubmitApplication(req: AgencyRequest, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { firstName, lastName, company, cRNumber, phone } = req.body as TWebAgencyResubmitApplicationRequest;
      const { agencyId, agencyTeamId } = req.agency;

      const agency = await AgencyModel.findOne({
        _id: agencyId,
        deletedAt: null,
      }).session(session);

      if (!agency) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Agency not found");
      }

      if (agency.verificationStatus !== VerificationStatusEnum.reject) {
        await session.abortTransaction();
        return ResJson.invalid(res, "Only rejected agencies can resubmit their application");
      }

      const agencyTeamMember = await AgencyTeamModel.findOne({
        _id: agencyTeamId,
        agencyId,
        deletedAt: null,
      }).session(session);

      if (!agencyTeamMember) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Agency team member not found");
      }

      const normalizedCRN = StringHelpers.normalizeCRN(cRNumber);

      const existingAgency = await AgencyModel.findOne({
        _id: { $ne: agencyId },
        deletedAt: null,
        $or: [{ companyName: { $regex: `^${company}$`, $options: "i" } }, { cRNumber: normalizedCRN }],
      })
        .session(session)
        .lean();

      if (existingAgency) {
        await session.abortTransaction();
        return ResJson.invalid(res, "Another agency already registered with this company name or CR Number");
      }

      // Update agency
      agency.companyName = company;
      agency.cRNumber = normalizedCRN;
      agency.companyPhone = phone;
      agency.verificationStatus = VerificationStatusEnum.pending;
      agency.verificationRejectMessage = null;
      agency.verifiedAt = null;
      agency.verifiedBy = null;
      agency.updatedAt = new Date();
      agency.updatedBy = DBHelper.actor(req);

      await agency.save({ session });

      // Update agency team member
      agencyTeamMember.firstName = firstName;
      agencyTeamMember.lastName = lastName;
      agencyTeamMember.phone = phone;
      agencyTeamMember.verificationStatus = VerificationStatusEnum.pending;
      agencyTeamMember.status = StatusEnum.active;
      agencyTeamMember.updatedAt = new Date();
      agencyTeamMember.updatedBy = DBHelper.actor(req);

      await agencyTeamMember.save({ session });

      await session.commitTransaction();

      return ResJson.success(res, "Application resubmitted successfully", {
        user: {
          agencyId: agency.agencyId,
          email: agency.companyEmail,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      return ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }
}

export const WebAgencyController = new WebAgencyControllerClass();
