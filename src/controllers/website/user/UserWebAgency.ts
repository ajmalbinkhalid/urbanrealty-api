import type { Response } from "express";
import mongoose from "mongoose";
import { AgencyModel } from "@/database/models/AgencyModel";
import { PropertyModel } from "@/database/models/PropertyModel";
import { OwnerTypeEnum } from "@/enum/OwnerTypeEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TGetOneAgency } from "@/routes/app/user/validations/UserAppAgencyRouterValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";

class UserWebAgencyClass {
  async getAllAgencies(req: UserRequest, res: Response): Promise<void> {
    try {
      const agencies = await DBHelper.fetch({
        model: AgencyModel,
        req,
        filters: {
          deletedAt: null,
          verificationStatus: VerificationStatusEnum.active,
          status: StatusEnum.active,
        },
        searchFields: ["companyName"],

        projection: {
          _id: 1,
          agencyId: 1,
          companyName: 1,
          companyEmail: 1,
          companyWhatsapp: 1,
          cRNumber: 1,
          companyPhone: 1,
          isFeatured: 1,
          about: DBHelper.locale(req, "$about"),
          companyLogo: DBHelper.file("$companyLogo"),
          coverImage: DBHelper.file("$coverImage"),
          activeSalePropertiesCount: 1,
          activeRentPropertiesCount: 1,
        },
      });

      ResJson.success(res, "agency listings fetched successfully", agencies);
    } catch (error) {
      ResJson.error(res, error);
    }
  }
  async getFeaturedAgencies(req: UserRequest, res: Response): Promise<void> {
    try {
      const agencies = await AgencyModel.aggregate([
        {
          $match: {
            deletedAt: null,
            isFeatured: true,
            verificationStatus: VerificationStatusEnum.active,
            status: StatusEnum.active,
          },
        },

        {
          $project: {
            _id: 1,
            agencyId: 1,
            companyName: 1,
            companyEmail: 1,
            companyWhatsapp: 1,

            cRNumber: 1,
            companyPhone: 1,
            isFeatured: 1,
            about: DBHelper.locale(req, "$about"),
            createdAt: 1,

            companyLogo: DBHelper.file("$companyLogo"),
            coverImage: DBHelper.file("$coverImage"),

            activeSalePropertiesCount: 1,
            activeRentPropertiesCount: 1,
          },
        },
      ]);

      ResJson.success(res, "agency listings fetched successfully", agencies);
    } catch (error) {
      ResJson.error(res, error);
    }
  }
  async getOneAgency(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetOneAgency["params"];

      const agencies = await AgencyModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            status: StatusEnum.active,
            verificationStatus: VerificationStatusEnum.active,
            deletedAt: null,
          },
        },
        {
          $project: {
            _id: 1,
            agencyId: 1,
            companyName: 1,
            companyEmail: 1,
            companyWhatsapp: 1,
            cRNumber: 1,
            about: DBHelper.locale(req, "$about"),
            companyPhone: 1,
            isFeatured: 1,
            createdAt: 1,
            companyLogo: DBHelper.file("$companyLogo"),
            coverImage: DBHelper.file("$coverImage"),
            activeSalePropertiesCount: 1,
            activeRentPropertiesCount: 1,
          },
        },
      ]);

      if (!agencies || agencies.length === 0) {
        return ResJson.notFound(res, "agency not found");
      }
      const activeProperties = await PropertyModel.aggregate([
        {
          $match: {
            "owner.ownerType": OwnerTypeEnum.agency,
            "owner.ownerId": new mongoose.Types.ObjectId(id),
            status: StatusEnum.active,
            verificationStatus: VerificationStatusEnum.active,
            deletedAt: null,
          },
        },
        { $limit: 4 },
        {
          $project: {
            _id: 1,
            title: DBHelper.locale(req, "$title"),
            description: DBHelper.locale(req, "$description"),
            purpose: 1,
            price: 1,
            coverImage: DBHelper.file("$coverImage"),
            createdAt: 1,
          },
        },
      ]);

      ResJson.success(res, "agency fetched successfully", {
        agency: agencies[0],
        activeProperties,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }
}
export const UserWebAgencyController = new UserWebAgencyClass();
