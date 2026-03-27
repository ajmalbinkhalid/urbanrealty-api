import type { Response } from "express";
import { PackageModel } from "@/database/models/PackageModel";
import { PackageSubsciptionTypeEnum, PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";
import { StatusEnum } from "@/enum/StatusEnum";
import type { AgencyRequest } from "@/types/agency-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";

class AgencyWebControllerClass {
  async getAllPackages(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const { type, locale } = req.query as { type?: string; locale?: string };
      const isArabic = locale === "ar";

      const filters: Record<string, unknown> = {
        userType: UserTypeEnum.Agent,
      };

      if (type === "subscription") {
        filters.type = PackageTypeEnum.Subscription;
        filters.noOfProperties = { $ne: null };
        filters.flatPrice = { $ne: null };
      }

      if (type === "promotion") {
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
            offerText: DBHelper.locale(req, "$offerText"),

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
      const freePackage = {
        _id: "free",
        name: isArabic ? "مجاني" : "Free",

        type: PackageSubsciptionTypeEnum.Free,
        userType: UserTypeEnum.Agent,
        status: StatusEnum.active,

        noOfProperties: 1,
        noOfFeaturedProperty: 0,
        validity: null,
      };

      const customPackage = {
        _id: "custom",
        name: isArabic ? "مخصص" : "Custom",
        type: PackageSubsciptionTypeEnum.Custom,
        userType: PackageSubsciptionTypeEnum.Custom,
        status: StatusEnum.active,
        noOfProperties: null,
        noOfFeaturedProperty: null,
      };

      const finalResult = [
        freePackage,
        ...dbPackages.map((pkg) => ({
          _id: pkg._id ?? null,
          subscriptionId: pkg.subscriptionId ?? null,
          name: pkg.name ?? null,
          offerText: pkg.offerText ?? null,

          type: pkg.type,
          userType: pkg.userType,
          status: pkg.status,

          price: pkg.price ?? null,
          flatPrice: pkg.flatPrice ?? null,

          noOfProperties: pkg.noOfProperties ?? null,
          noOfFeaturedProperty: pkg.noOfFeaturedProperty ?? null,
          validity: pkg.validity ?? null,

          createdAt: pkg.createdAt ?? null,
          createdBy: pkg.createdBy ?? null,
        })),
        customPackage,
      ];

      return ResJson.success(res, "Packages fetched successfully", finalResult);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const UserAppController = new AgencyWebControllerClass();
