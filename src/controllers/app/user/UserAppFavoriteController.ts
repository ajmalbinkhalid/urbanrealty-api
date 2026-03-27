import type { Response } from "express";
import mongoose, { type PipelineStage } from "mongoose";
import { AmenityModel } from "@/database/models/AmenitiesModel";
import { FavoriteModel } from "@/database/models/FavoriteModel";
import { LocationModel } from "@/database/models/LocationModel";
import { PropertyModel } from "@/database/models/PropertyModel";
import { SubCategoryModel } from "@/database/models/SubCategoryModel";
import type { TToggleFavoriteParams } from "@/routes/app/user/validations/UserFavoriteRouterValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { ReqHelpers } from "@/utils/req-helper";
import { ResJson } from "@/utils/response-json";

class UserAppFavoriteControllerClass {
  async toggleFavorite(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const { id } = req.params as TToggleFavoriteParams;

      const propertyExists = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        deletedAt: null,
      });

      if (!propertyExists) {
        return ResJson.notFound(res, "Property not found");
      }

      const existingFavorite = await FavoriteModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        propertyId: new mongoose.Types.ObjectId(id),
      });

      if (existingFavorite) {
        await existingFavorite.deleteOne();

        return ResJson.success(res, "Removed from favorites", {
          isFavorite: false,
        });
      }

      await FavoriteModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        propertyId: new mongoose.Types.ObjectId(id),
      });

      return ResJson.success(res, "Added to favorites", {
        isFavorite: true,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
  async getUserFavorite(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;

      const filters: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
      };

      const result = await DBHelper.fetch({
        model: FavoriteModel,
        req,
        filters,

        sortBy: { createdAt: -1 },

        projection: {
          _id: 1,
          propertyId: 1,
          createdAt: 1,
        },
      });
      return ResJson.success(res, "Favorite fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getFavoriteProperties(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;

      const pipeline: PipelineStage[] = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: PropertyModel.collection.name,
            localField: "propertyId",
            foreignField: "_id",
            as: "propertyDetails",
          },
        },
        {
          $unwind: "$propertyDetails",
        },
        {
          $replaceRoot: {
            newRoot: "$propertyDetails",
          },
        },
        {
          $match: {
            deletedAt: null,
          },
        },
        {
          $lookup: {
            from: LocationModel.collection.name,

            localField: "propertyInformation.locationId",
            foreignField: "_id",
            as: "locationDetails",
          },
        },
        {
          $lookup: {
            from: SubCategoryModel.collection.name,
            localField: "propertyInformation.propertySubCategoryId",
            foreignField: "_id",
            as: "subCategoryDetails",
          },
        },
        {
          $lookup: {
            from: AmenityModel.collection.name,
            localField: "amenitiesId",
            foreignField: "_id",
            as: "amenities",
          },
        },
      ];

      const result = await DBHelper.fetch({
        model: FavoriteModel,
        req,
        lookups: pipeline,
        sortBy: { createdAt: -1 },
        projection: {
          _id: 1,
          purpose: 1,
          propertyCategoryId: 1,
          amenitiesId: 1,
          propertyInformation: {
            title: DBHelper.locale(req, "$propertyInformation.title"),
            description: DBHelper.locale(req, "$propertyInformation.description"),
            landmark: DBHelper.locale(req, "$propertyInformation.landmark"),
            locationId: 1,
            locationName: {
              $cond: [{ $gt: [{ $size: "$locationDetails" }, 0] }, { $arrayElemAt: [`$locationDetails.city.${ReqHelpers.locale(req)}`, 0] }, null],
            },
            propertySubCategoryId: 1,
            propertySubCategoryName: {
              $cond: [{ $gt: [{ $size: "$subCategoryDetails" }, 0] }, { $arrayElemAt: [`$subCategoryDetails.name.${ReqHelpers.locale(req)}`, 0] }, null],
            },
            price: 1,
            longitude: { $arrayElemAt: ["$propertyInformation.location.coordinates", 0] },
            latitude: { $arrayElemAt: ["$propertyInformation.location.coordinates", 1] },
          },
          keyFeatures: {
            bedrooms: 1,
            bathrooms: 1,
            kitchens: 1,
            livingRooms: 1,
            maidRooms: 1,
            area: 1,
          },
          isFeatured: 1,
          status: 1,
          verificationStatus: 1,
          coverImage: DBHelper.file("$coverImage"),
          images: 1,
          ownerDetails: {
            $cond: [
              { $eq: ["$owner.ownerType", 0] },
              {
                name: "admin",
                email: "admin@urbanrealty.com",
              },
              {
                $cond: [
                  { $eq: ["$owner.ownerType", 1] },
                  { $arrayElemAt: ["$userOwnerData", 0] },
                  {
                    $cond: [{ $eq: ["$owner.ownerType", 2] }, { $arrayElemAt: ["$agencyOwnerData", 0] }, null],
                  },
                ],
              },
            ],
          },
          createdAt: 1,
          updatedAt: 1,
        },
      });

      return ResJson.success(res, "Favorite properties fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}
export const UserAppFavoriteController = new UserAppFavoriteControllerClass();
