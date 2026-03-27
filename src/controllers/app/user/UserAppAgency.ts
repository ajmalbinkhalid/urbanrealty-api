import type { Response } from "express";
import mongoose from "mongoose";
import { AgencyModel } from "@/database/models/AgencyModel";
import { PropertyModel } from "@/database/models/PropertyModel";
import { OwnerTypeEnum } from "@/enum/OwnerTypeEnum";
import { PropertySortByEnum } from "@/enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TGetOneAgency } from "@/routes/app/user/validations/UserAppAgencyRouterValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";

class UserAppAgencyClass {
  async getAllAgencies(req: UserRequest, res: Response): Promise<void> {
    const { sortBy } = req.query as { sortBy?: string };

    try {
      const sortByNum = sortBy ? Number(sortBy) : null;
      const sortByField: Record<string, 1 | -1> =
        sortByNum === PropertySortByEnum.Oldest ? { createdAt: 1 } : { createdAt: -1 };

      const agencies = await DBHelper.fetch({
        model: AgencyModel,
        req,
        filters: {
          deletedAt: null,
          verificationStatus: VerificationStatusEnum.active,
          status: StatusEnum.active,
        },
        searchFields: ["companyName"],
        sortBy: sortByField,
        projection: {
          _id: 1,
          agencyId: 1,
          companyName: 1,
          coverImage: DBHelper.file("$coverImage"),
          companyLogo: DBHelper.file("$companyLogo"),
          companyEmail: 1,
          companyWhatsapp: 1,
          cRNumber: 1,
          companyPhone: 1,
          isFeatured: 1,
          about: DBHelper.locale(req, "$about"),
          activeSalePropertiesCount: 1,
          activeRentPropertiesCount: 1,
          createdAt: 1,
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
            companyLogo: DBHelper.file("$companyLogo"),
            coverImage: DBHelper.file("$coverImage"),
            companyEmail: 1,
            companyWhatsapp: 1,
            cRNumber: 1,
            companyPhone: 1,
            isFeatured: 1,
            about: DBHelper.locale(req, "$about"),
            createdAt: 1,
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
            companyLogo: DBHelper.file("$companyLogo"),
            coverImage: DBHelper.file("$coverImage"),
            companyEmail: 1,
            companyWhatsapp: 1,
            cRNumber: 1,
            about: DBHelper.locale(req, "$about"),
            companyPhone: 1,
            isFeatured: 1,
            createdAt: 1,
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
            purpose: 1,
            propertyCategoryId: 1,
            verificationStatus: "$verificationStatus",
            isFeatured: 1,
            propertyInformation: {
              title: DBHelper.locale(req, "$propertyInformation.title"),
              locationId: "$propertyInformation.locationId",
              price: 1,
              landmark: DBHelper.locale(req, "$propertyInformation.landmark"),
              locationName: DBHelper.locale(req, "$location.city"),
              propertySubCategoryId: "$propertyInformation.propertySubCategoryId",
              propertySubcategoryName: DBHelper.locale(req, "$propertyInformation.propertySubcategoryName"),
              description: DBHelper.locale(req, "$propertyInformation.description"),
              area: "$propertyInformation.area",
              possessionStatus: "$propertyInformation.possessionStatus",
              latitude: "$propertyInformation.location.coordinates[0]",
              longitude: "$propertyInformation.location.coordinates[1]",
            },
            coverImage: DBHelper.file("$coverImage"),
            createdAt: 1,
          },
        },
      ]);

      const agency = agencies[0];

      for (const property of activeProperties) {
        property.ownerDetails = {
          name: agency.companyName,
          email: agency.companyEmail,
        };
      }

      ResJson.success(res, "agency fetched successfully", {
        agency: agencies[0],
        activeProperties,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }
}
export const UserAppAgencyController = new UserAppAgencyClass();
