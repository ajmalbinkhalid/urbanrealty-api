import type { Response } from "express";
import { getNextSequence } from "@/database/models/CounterModel";
import { PackageModel } from "@/database/models/PackageModel";
import { PackageSubsciptionTypeEnum, PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";
import type { TCreateCustomPackageDetails } from "@/routes/app/user/validations/UserAppPackageRouterValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";

class AppUserPackagesControllerClass {
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
        .filter((pkg) => pkg.userType === UserTypeEnum.Customer);

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
export const AppUserPackagesController = new AppUserPackagesControllerClass();
