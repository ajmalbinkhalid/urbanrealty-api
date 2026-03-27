import type { Response } from "express";
import { AmenityModel } from "@/database/models/AmenitiesModel";
import { getNextSequence } from "@/database/models/CounterModel";
import { EnquiryModel } from "@/database/models/EnquiryModel";
import { LocationModel } from "@/database/models/LocationModel";
import { PackageModel } from "@/database/models/PackageModel";
import { SubCategoryModel } from "@/database/models/SubCategoryModel";
import { PackageSubsciptionTypeEnum, PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";
import { StatusEnum } from "@/enum/StatusEnum";
import type { TCreateCustomPackageDetails } from "@/routes/app/user/validations/UserAppPackageRouterValidation";
import type { TCreateEnquiryRequest } from "@/routes/website/user/validations/EnquiryRouterValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";

class UserAppControllerClass {
  async getLocations(req: UserRequest, res: Response): Promise<void> {
    try {
      const locations = await DBHelper.fetch({
        model: LocationModel,
        req,
        searchFields: [DBHelper.locale(req, "city")],
        filters: { status: StatusEnum.active, deletedAt: null },
        projection: { city: DBHelper.locale(req, "$city"), _id: 1 },
      });

      ResJson.success(res, "Location fetch successful", locations);
      return;
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getAmenities(req: UserRequest, res: Response): Promise<void> {
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

      ResJson.success(res, "Amenities fetched successfully", amenities);
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getSubCategories(req: UserRequest, res: Response): Promise<void> {
    try {
      const { categoryId } = req.query;

      const filters = {
        status: StatusEnum.active,
        deletedAt: null,
      } as Record<string, unknown>;

      if (categoryId) {
        filters.propertyCategoryId = Number(categoryId);
      }

      const subCategories = await DBHelper.fetch({
        model: SubCategoryModel,
        req,
        searchFields: [DBHelper.locale(req, "name")],
        filters,
        projection: {
          _id: 1,
          subCategoryId: 1,
          propertyCategoryId: 1,
          name: DBHelper.locale(req, "$name"),
        },
      });

      ResJson.success(res, "Sub categories fetched successfully", subCategories);
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async createEnquiry(req: UserRequest, res: Response): Promise<void> {
    const session = await EnquiryModel.startSession();
    session.startTransaction();
    try {
      const userId = req.user.userId;
      const data = req.body as TCreateEnquiryRequest;
      const enquiryId = await getNextSequence("enquiryId", session);
      const enquiryDocs = await EnquiryModel.create(
        [
          {
            ...data,
            enquiryId,
            userId,
          },
        ],
        { session }
      );
      await session.commitTransaction();
      ResJson.success(res, "enquiry created successfully", {
        enquiry: enquiryDocs[0],
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }
}

export const UserAppController = new UserAppControllerClass();
