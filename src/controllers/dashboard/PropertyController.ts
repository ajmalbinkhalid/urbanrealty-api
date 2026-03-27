import type { Response } from "express";
import mongoose from "mongoose";
import { AmenityModel } from "@/database/models/AmenitiesModel";
import { LocationModel } from "@/database/models/LocationModel";
import { getPropertyOwnerDetails, PropertyModel } from "@/database/models/PropertyModel";
import { SubCategoryModel } from "@/database/models/SubCategoryModel";
import { OwnerTypeEnum } from "@/enum/OwnerTypeEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type {
  TCreatePropertyRequest,
  TDeletePropertyParams,
  TGetPropertyParams,
  TTogglePropertyFeaturedStatusParams,
  TTogglePropertyStatusParams,
  TUpdatePropertyParams,
  TUpdatePropertyRequest,
  TUpdateVerificationStatusParams,
  TUpdateVerificationStatusRequest,
} from "@/routes/dashboard/validations/PropertyRouterValidation";
import { PropertyService } from "@/services/PropertyService";
import type { AdminRequest } from "@/types/admin-type";
import { decrementAgencyPropertyCount, incrementAgencyPropertyCount } from "@/utils/agency-property-count-helpers";
import { DBHelper } from "@/utils/db-helpers";
import { FileHelper } from "@/utils/file-helpers";
import { ReqHelpers } from "@/utils/req-helper";
import { ResJson } from "@/utils/response-json";

class PropertyControllerClass {
  async createProperty(req: AdminRequest, res: Response): Promise<void> {
    const session = await PropertyModel.startSession();
    session.startTransaction();

    try {
      const body = req.body as TCreatePropertyRequest;

      // Use PropertyService to create the property
      const result = await PropertyService.createProperty({
        body,
        req,
        session,
        verificationStatus: VerificationStatusEnum.active,
      });

      if (!result.success) {
        await session.abortTransaction();
        return ResJson.invalid(res, result.error || "Failed to create property");
      }

      await session.commitTransaction();

      ResJson.success(res, "Property created successfully", {
        property: result.property,
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async getAllProperty(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query as { status?: string };

      const filters: Record<string, unknown> = {
        deletedAt: null,
      };

      if (status) {
        switch (status) {
          case "active":
            filters.verificationStatus = VerificationStatusEnum.active;
            break;

          case "pending":
            filters.verificationStatus = VerificationStatusEnum.pending;
            break;

          case "inactive":
            filters.verificationStatus = VerificationStatusEnum.reject;
            break;
          default:
            break;
        }
      }

      const result = await DBHelper.fetch({
        model: PropertyModel,
        req,
        filters,
        searchFields: ["propertyId", "propertyInformation.title.en", "purpose", "propertyInformation.location.name"],

        lookups: [
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
        ],

        sortBy: { createdAt: -1 },

        projection: {
          propertyId: 1,
          owner: 1,
          _id: 1,
          purpose: 1,
          propertyCategoryId: 1,

          propertyInformation: {
            title: DBHelper.locale(req, "$propertyInformation.title"),
            landmark: DBHelper.locale(req, "$propertyInformation.landmark"),
            locationId: 1,

            locationName: {
              $cond: [
                { $gt: [{ $size: "$locationDetails" }, 0] },
                {
                  $arrayElemAt: [`$locationDetails.city.${ReqHelpers.locale(req)}`, 0],
                },
                null,
              ],
            },

            propertySubCategoryId: 1,
            propertySubCategoryName: {
              $cond: [
                { $gt: [{ $size: "$subCategoryDetails" }, 0] },
                {
                  $arrayElemAt: [`$subCategoryDetails.name.${ReqHelpers.locale(req)}`, 0],
                },
                null,
              ],
            },

            price: 1,

            location: {
              longitude: {
                $arrayElemAt: ["$propertyInformation.location.coordinates", 0],
              },
              latitude: {
                $arrayElemAt: ["$propertyInformation.location.coordinates", 1],
              },
            },
          },

          isFeatured: 1,
          address: 1,
          status: 1,
          coverImage: DBHelper.file("$coverImage"),
          createdAt: 1,
          verificationStatus: 1,
        },
      });

      // Process owner details for each property
      const propertiesWithOwnerDetails = await Promise.all(
        result.items.map(async (property: { owner: { ownerType: number; ownerId: mongoose.Types.ObjectId; agencyMemberId?: mongoose.Types.ObjectId | null } } & Record<string, unknown>) => ({
          ...property,
          ownerDetails: await getPropertyOwnerDetails(property.owner),
        }))
      );

      return ResJson.success(res, "Properties fetched successfully", {
        ...result,
        items: propertiesWithOwnerDetails,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getPropertyDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetPropertyParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        deletedAt: null,
      }).lean();

      if (!property) {
        return ResJson.notFound(res, "Property not found");
      }

      const amenities = await AmenityModel.find({
        _id: { $in: property.amenitiesId },
        deletedAt: null,
      }).lean();

      const location = await LocationModel.findOne({
        _id: property.propertyInformation.locationId,
        deletedAt: null,
      }).lean();

      const subCategory = await SubCategoryModel.findOne({
        _id: property.propertyInformation.propertySubCategoryId,
        deletedAt: null,
      }).lean();

      const ownerDetails = await getPropertyOwnerDetails(property.owner);
      const ownerName = ownerDetails.name;
      const ownerEmail = ownerDetails.email;
      const ownerId = ownerDetails.id;

      const propertyDetails = {
        propertyId: property.propertyId,
        _id: property._id,
        purpose: property.purpose,
        propertyCategoryId: property.propertyCategoryId,
        propertyInformation: {
          title: property.propertyInformation.title,
          address: property.propertyInformation.address,
          description: property.propertyInformation.description,
          landmark: property.propertyInformation.landmark[ReqHelpers.locale(req)],
          landmarkObject: property.propertyInformation.landmark,
          locationId: property.propertyInformation.locationId,
          locationName: location ? location.city[ReqHelpers.locale(req)] : null,
          area: property.propertyInformation.area,
          price: property.propertyInformation.price,
          possessionStatus: property.propertyInformation.possessionStatus,
          propertySubCategoryId: property.propertyInformation.propertySubCategoryId,
          propertySubCategoryName: subCategory ? subCategory.name[ReqHelpers.locale(req)] : null,
          location: property.propertyInformation.location,
        },
        keyFeatures: property.keyFeatures,
        amenitiesId: property.amenitiesId,
        amenities: amenities.map((amenity) => ({
          _id: amenity._id,
          name: amenity.name[ReqHelpers.locale(req)],
          icon: FileHelper.getUrl(amenity.icon),
        })),

        coverImage: FileHelper.getUrl(property.coverImage),
        galleryImages: property.galleryImages.map((img) => FileHelper.getUrl(img)),
        verificationStatus: property.verificationStatus,
        verifiedAt: property.verifiedAt,
        verifiedBy: property.verifiedBy,
        status: property.status,
        isFeatured: property.isFeatured,
        createdAt: property.createdAt,
        ownerId: property.owner.ownerId,
        owner: {
          ownerName,
          ownerId,
          ownerEmail,
          ownerType: property.owner.ownerType,
        },
      };

      return ResJson.success(res, "Property fetched successfully", {
        property: propertyDetails,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async deleteProperty(req: AdminRequest, res: Response): Promise<void> {
    const session = await PropertyModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TDeletePropertyParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        deletedAt: null,
      }).session(session);

      if (!property) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Property not found");
      }

      // Decrement agency count if property was active (verified + enabled)
      if (property.owner.ownerType === OwnerTypeEnum.agency && property.verificationStatus === VerificationStatusEnum.active && property.status === StatusEnum.active && property.purpose) {
        await decrementAgencyPropertyCount(property.owner.ownerId, property.purpose, session);
      }

      property.deletedAt = new Date();
      await property.save({ session });

      await session.commitTransaction();
      return ResJson.success(res, "Property deleted successfully");
    } catch (error) {
      await session.abortTransaction();
      return ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async togglePropertyStatus(req: AdminRequest, res: Response): Promise<void> {
    const session = await PropertyModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TTogglePropertyStatusParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        deletedAt: null,
      }).session(session);

      if (!property) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Property not found");
      }

      const wasActive = property.status === StatusEnum.active;
      property.status = wasActive ? StatusEnum.inactive : StatusEnum.active;

      // Update agency count only for agency-owned properties that are verified
      if (property.owner.ownerType === OwnerTypeEnum.agency && property.verificationStatus === VerificationStatusEnum.active && property.purpose) {
        if (property.status === StatusEnum.active) {
          // Toggling to active: increment count
          await incrementAgencyPropertyCount(property.owner.ownerId, property.purpose, session);
        } else {
          // Toggling to inactive: decrement count
          await decrementAgencyPropertyCount(property.owner.ownerId, property.purpose, session);
        }
      }

      await property.save({ session });

      await session.commitTransaction();
      return ResJson.success(res, "Property status updated successfully", {
        status: property.status,
      });
    } catch (error) {
      await session.abortTransaction();
      return ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async togglePropertyFeaturedStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TTogglePropertyFeaturedStatusParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        deletedAt: null,
      });

      if (!property) {
        return ResJson.notFound(res, "Property not found");
      }

      property.isFeatured = !property.isFeatured;
      await property.save();

      return ResJson.success(res, "Property featured status updated successfully", {
        isFeatured: property.isFeatured,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async updateProperty(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TUpdatePropertyParams;
      const body = req.body as TUpdatePropertyRequest;

      const { success, property, error } = await PropertyService.updateProperty({
        body,
        req,
        propertyId: id,
        isAdmin: true,
      });

      if (!success) {
        return ResJson.invalid(res, error || "Failed to update property");
      }

      return ResJson.success(res, "Property updated successfully", { property });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async updatePropertyVerificationStatus(req: AdminRequest, res: Response): Promise<void> {
    const session = await PropertyModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TUpdateVerificationStatusParams;
      const { status, remarks } = req.body as TUpdateVerificationStatusRequest;

      // Validate status
      if (!["accept", "reject"].includes(status)) {
        await session.abortTransaction();
        return ResJson.invalid(res, "Invalid verification status");
      }

      // Reject requires remarks
      if (status === "reject" && !remarks) {
        await session.abortTransaction();
        return ResJson.invalid(res, "Remarks are required when rejecting a property");
      }

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        verificationStatus: VerificationStatusEnum.pending,
      }).session(session);

      if (!property) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Property not found or already verified");
      }

      if (status === "accept") {
        property.verificationStatus = VerificationStatusEnum.active;
        property.verifiedAt = new Date();
        property.verifiedBy = req.admin.adminId;
        property.set("verificationRejectMessage", null);

        // Increment agency count if property is active and owned by agency
        if (property.owner.ownerType === OwnerTypeEnum.agency && property.status === StatusEnum.active && property.purpose) {
          await incrementAgencyPropertyCount(property.owner.ownerId, property.purpose, session);
        }
      }

      if (status === "reject") {
        property.verificationStatus = VerificationStatusEnum.reject;
        property.set("verificationRejectMessage", remarks);
        property.verifiedAt = new Date();
        property.verifiedBy = req.admin.adminId;
      }

      property.updatedAt = new Date();
      property.updatedBy = DBHelper.actor(req);

      await property.save({ session });

      await session.commitTransaction();
      return ResJson.success(res, "Property verification status updated successfully", {
        propertyId: property._id,
        verificationStatus: property.verificationStatus,
      });
    } catch (error) {
      await session.abortTransaction();
      return ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }
}

export const PropertyController = new PropertyControllerClass();
