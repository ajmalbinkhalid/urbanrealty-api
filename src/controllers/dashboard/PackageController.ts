import { PackageModel } from "@database/models/PackageModel";
import { ResJson } from "@utils/response-json";
import type { Response } from "express";
import { getNextSequence } from "@/database/models/CounterModel";
import { PurchaseModel } from "@/database/models/PurchaseModel";
import { PackageSubsciptionTypeEnum, PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";
import { StatusEnum } from "@/enum/StatusEnum";
import type { TCreatePackageRequest, TDeletePackageParams, TGetPackageParams, TTogglePackageStatusParams, TUpdatePackageRequest } from "@/routes/dashboard/validations/PackageRouteValidation";
import type { TGetPurchaseParams } from "@/routes/dashboard/validations/PurchaseRouteValidation";
import type { AdminRequest } from "@/types/admin-type";
import { DBHelper } from "@/utils/db-helpers";

class PackageControllerClass {
  async getAllPackages(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { query: type } = req.query as { query?: string };

      // same pattern as getAllAgencies
      const filters = {} as Record<string, unknown>;

      if (type) {
        switch (type) {
          case "subscription":
            filters.type = PackageTypeEnum.Subscription;
            filters.noOfProperties = { $ne: null };
            filters.flatPrice = { $ne: null };
            break;

          case "promotion":
            filters.type = PackageTypeEnum.Promotion;
            filters.noOfProperties = null;
            filters.flatPrice = null;
            break;
          default:
            break;
        }
      }

      const result = await DBHelper.fetch({
        model: PackageModel,
        req,
        searchFields: ["name.en", "name.ar"],
        filters,
        projection: {
          _id: 1,
          price: 1,
          type: 1,
          userType: 1,
          subscriptionId: 1,
          name: 1,
          offerText: 1,
          flatPrice: 1,
          validity: 1,
          noOfProperties: 1,
          noOfFeaturedProperty: 1,
          status: 1,
          createdAt: 1,
          createdBy: 1,
        },
      });

      return ResJson.success(res, "Packages fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getPackageDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetPackageParams;

      const packageData = await PackageModel.findOne({
        _id: id,
        deletedAt: null,
      }).lean();

      if (!packageData) {
        return ResJson.notFound(res, "Package not found");
      }

      return ResJson.success(res, "Package fetched successfully", {
        package: packageData,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
  
  async createPackage(req: AdminRequest, res: Response): Promise<void> {
    const session = await PackageModel.startSession();
    session.startTransaction();

    try {
      const data = req.body as TCreatePackageRequest;

      const existingPackage = await PackageModel.findOne({
        deletedAt: null,
        userType: data.userType,
        $or: [{ "name.en": data.name.en }, { "name.ar": data.name.ar }],
      })
        .session(session)
        .lean();

      if (existingPackage) {
        await session.abortTransaction();
        ResJson.invalid(res, "Package with this name already exists for this user type");
        return;
      }

      const subscriptionId = await getNextSequence("subscriptionId", session);

      const packageDocs = await PackageModel.create(
        [
          {
            ...data,
            subscriptionType: PackageSubsciptionTypeEnum.Standard,
            subscriptionId,
            createdBy: DBHelper.actor(req),
            updatedBy: DBHelper.actor(req),
          },
        ],
        { session }
      );

      await session.commitTransaction();

      ResJson.success(res, "Package created successfully", {
        package: packageDocs[0],
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async updatePackage(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetPackageParams;

      const data = req.body as TUpdatePackageRequest;

      const packageData = await PackageModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!packageData) {
        return ResJson.notFound(res, "Package not found");
      }

      const duplicatePackage = await PackageModel.findOne({
        _id: { $ne: id },
        deletedAt: null,
        userType: data.userType,
        $or: [{ "name.en": data.name.en }, { "name.ar": data.name.ar }],
      }).lean();

      if (duplicatePackage) {
        return ResJson.invalid(res, "Package with this name already exists for this user type");
      }

      Object.assign(packageData, data);

      if (data.type === PackageTypeEnum.Promotion) {
        packageData.noOfProperties = null;
        packageData.flatPrice = null;
        packageData.offerText = "";
      }

      packageData.updatedBy = DBHelper.actor(req);
      packageData.updatedAt = new Date();

      await packageData.save();

      return ResJson.success(res, "Package updated successfully", packageData);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async deletePackage(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TDeletePackageParams;

      const packageData = await PackageModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!packageData) {
        return ResJson.notFound(res, "Package not found");
      }

      packageData.deletedAt = new Date();
      packageData.deletedBy = DBHelper.actor(req);

      await packageData.save();

      return ResJson.success(res, "Package deleted successfully");
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
  async toggleStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TTogglePackageStatusParams;

      const packageData = await PackageModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!packageData) {
        return ResJson.notFound(res, "Package not found");
      }

      const actor = DBHelper.actor(req);

      packageData.status = packageData.status === StatusEnum.active ? StatusEnum.inactive : StatusEnum.active;

      packageData.updatedAt = new Date();
      packageData.updatedBy = actor;
      packageData.createdBy = actor;

      await packageData.save();

      return ResJson.success(res, `Package ${packageData.status === StatusEnum.active ? "activated" : "deactivated"} successfully`, {
        packageId: packageData._id,
        status: packageData.status,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}
export const PackageController = new PackageControllerClass();

class PurchaseControllerClass {
  async getAllPurchases(req: AdminRequest, res: Response): Promise<void> {
    try {
      const result = await DBHelper.fetch({
        model: PurchaseModel,
        req,

        searchFields: ["searchUserName", "searchUserEmail", "searchUserType", "searchPackageName", "searchSubscriptionId"],

        lookups: [
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "customerDetails",
            },
          },

          {
            $lookup: {
              from: "agents",
              localField: "user",
              foreignField: "_id",
              as: "agentDetails",
            },
          },

          {
            $lookup: {
              from: "packages",
              localField: "packageName",
              foreignField: "_id",
              as: "packageDetails",
            },
          },
          {
            $unwind: {
              path: "$packageDetails",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $addFields: {
              owner: {
                $cond: [{ $eq: ["$userType", UserTypeEnum.Customer] }, { $arrayElemAt: ["$customerDetails", 0] }, { $arrayElemAt: ["$agentDetails", 0] }],
              },

              searchUserName: {
                $cond: [
                  { $eq: ["$userType", UserTypeEnum.Customer] },
                  {
                    $concat: [{ $arrayElemAt: ["$customerDetails.firstName", 0] }, " ", { $arrayElemAt: ["$customerDetails.lastName", 0] }],
                  },
                  { $arrayElemAt: ["$agentDetails.name", 0] },
                ],
              },

              searchUserEmail: {
                $cond: [{ $eq: ["$userType", UserTypeEnum.Customer] }, { $arrayElemAt: ["$customerDetails.email", 0] }, { $arrayElemAt: ["$agentDetails.email", 0] }],
              },

              searchUserType: {
                $cond: [{ $eq: ["$userType", UserTypeEnum.Customer] }, "CUSTOMER", "AGENT"],
              },

              searchPackageName: "$packageDetails.name.en",
              searchSubscriptionId: "$packageDetails.subscriptionId",
            },
          },
        ],

        projection: {
          _id: 1,
          purchaseId: 1,
          userType: 1,

          owner: {
            _id: "$owner._id",
            name: "$searchUserName",
            email: "$searchUserEmail",
            type: "$searchUserType",
          },

          package: {
            _id: "$packageDetails._id",
            name: "$packageDetails.name",
            subscriptionId: "$packageDetails.subscriptionId",
          },

          price: 1,
          validity: 1,
          status: 1,
          createdAt: 1,
        },
      });
      return ResJson.success(res, "Packages fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getPurchaseDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetPurchaseParams;

      const purchaseData = await PurchaseModel.findOne({
        _id: id,
        deletedAt: null,
      })
        .select({
          _id: 1,
          user: 1,
          userType: 1,
          packageName: 1,
          packageType: 1,
          createdAt: 1,
          validity: 1,
          noOfProperties: 1,
          noOfFeaturedProperty: 1,
          status: 1,
        })
        .lean();

      if (!purchaseData) {
        return ResJson.notFound(res, "purchase not found");
      }

      return ResJson.success(res, "purchase fetched successfully", {
        purchase: purchaseData,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const PurchaseController = new PurchaseControllerClass();
