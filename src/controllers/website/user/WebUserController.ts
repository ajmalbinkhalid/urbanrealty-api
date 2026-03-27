import type { Response } from "express";
import mongoose from "mongoose";
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

class WebUserControllerClass {
  async getLocations(req: UserRequest, res: Response): Promise<void> {
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

      ResJson.success(res, "Amenities fetched successfully", { amenities });
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

  async getAllPackages(req: UserRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query as { type?: string; locale?: string };

      const filters: Record<string, unknown> = {
        userType: UserTypeEnum.Customer,
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

      let packagesList = dbPackages
        .map((pkg) => {
          // Convert flatPrice and noOfFeaturedProperty 0 to null
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
        .filter((pkg) => pkg.userType === UserTypeEnum.Customer);

      let finalResult;

      if (Number(type) === PackageTypeEnum.Promotion) {
        packagesList = packagesList.filter((pkg) => pkg.subscriptionType !== PackageSubsciptionTypeEnum.Custom && pkg.subscriptionType !== PackageSubsciptionTypeEnum.Free);
        finalResult = packagesList;
      } else {
        finalResult = packagesList;
      }

      return ResJson.success(res, "Packages fetched successfully", finalResult);
    } catch (error) {
      return ResJson.error(res, error);
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

  async createCustomPackage(req: UserRequest, res: Response): Promise<void> {
    const session = await PackageModel.startSession();

    session.startTransaction();
    try {
      // const userId = req.user.userId;
      const packageDetails = req.body as TCreateCustomPackageDetails;
      const customId = await getNextSequence("customId", session);

      const result = await PackageModel.create(
        [
          {
            type: PackageTypeEnum.Subscription,
            subscriptionType: PackageSubsciptionTypeEnum.Custom,
            validity: packageDetails.validity,
            userType: UserTypeEnum.Customer,
            noOfProperties: packageDetails.noOfProperties,
            noOfFeaturedProperty: packageDetails.noOfFeaturedProperty,
            subscriptionId: customId,
            price: 0,
            name: {
              en: "custom",
              ar: " مخصص",
            },
          },
        ],
        { session }
      );
      if (!result) {
        await session.abortTransaction();
        return ResJson.invalid(res, result || "Failed to create property");
      }
      await session.commitTransaction();

      return ResJson.success(res, "custom package created successfully", result);
    } catch (error) {
      ResJson.error(res, error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }
}

export const WebUserController = new WebUserControllerClass();
