import type { Response } from "express";
import mongoose, { type PipelineStage } from "mongoose";
import { AmenityModel } from "@/database/models/AmenitiesModel";
import { LocationModel } from "@/database/models/LocationModel";
import { getPropertyOwnerDetails, PropertyModel } from "@/database/models/PropertyModel";
import { SubCategoryModel } from "@/database/models/SubCategoryModel";
import { OwnerTypeEnum } from "@/enum/OwnerTypeEnum";
import { PropertyCategoryEnum, SortDirectionEnum } from "@/enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type {
  TCreatePropertyRequest,
  TDeletePropertyParams,
  TGetPropertyParams,
  TTogglePropertyFeaturedStatusParams,
  TTogglePropertyStatusParams,
  TUpdatePropertyParams,
  TUpdatePropertyRequest,
} from "@/routes/app/agency/validations/AgencyPropertyRouterValidation";
import { PropertyService } from "@/services/PropertyService";
import type { AgencyRequest } from "@/types/agency-type";
import { decrementAgencyPropertyCount, incrementAgencyPropertyCount } from "@/utils/agency-property-count-helpers";
import { DBHelper } from "@/utils/db-helpers";
import { FileHelper } from "@/utils/file-helpers";
import { ReqHelpers } from "@/utils/req-helper";
import { ResJson } from "@/utils/response-json";

class AppAgencyPropertiesControllerClass {
  async createProperty(req: AgencyRequest, res: Response): Promise<void> {
    const session = await PropertyModel.startSession();
    session.startTransaction();

    try {
      const body = req.body as TCreatePropertyRequest;
      const isDraft = body.isDraft;

      // Use PropertyService to create the property
      const result = await PropertyService.createProperty({
        body,
        req,
        session,
        isDraft,
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

  async getAgencyProperties(req: AgencyRequest, res: Response): Promise<void> {
    try {
      let sortOrder: 1 | -1 = -1; // default descending

      const sort = req.query.sortBy;

      if (Number(sort) === SortDirectionEnum.Ascending) {
        sortOrder = -1;
      } else if (Number(sort) === SortDirectionEnum.Descending) {
        sortOrder = 1;
      }
      const purpose = req.query.purpose; // "1" | "2" | undefined

      const locationId = req.query.city as string | undefined;
      const locationFilter = locationId && mongoose.Types.ObjectId.isValid(locationId) ? { "propertyInformation.locationId": new mongoose.Types.ObjectId(locationId) } : {};

      const rawStatus = req.query.verificationStatus;
      const status = typeof rawStatus === "string" && rawStatus.trim() !== "" ? Number(rawStatus) : undefined;

      const sortFilter = { createdAt: sortOrder } as { createdAt: 1 | -1 };
      const rawCategory = req.query.category;
      const categoryNum = typeof rawCategory === "string" && rawCategory.trim() !== "" ? Number(rawCategory) : undefined;

      const allowedStatuses = [VerificationStatusEnum.active, VerificationStatusEnum.reject, VerificationStatusEnum.pending, VerificationStatusEnum.draft] as const;

      type VerificationStatus = (typeof allowedStatuses)[number];
      const statusFilter = status !== undefined && allowedStatuses.includes(status as VerificationStatus) ? { verificationStatus: status as VerificationStatus } : {};

      const categoryFilter = typeof categoryNum === "number" && Object.values(PropertyCategoryEnum).includes(categoryNum as (typeof PropertyCategoryEnum)[keyof typeof PropertyCategoryEnum]) ? { propertyCategoryId: categoryNum } : {};

      const agencyId = req.agency.agencyId;

      const pipeline: PipelineStage[] = [
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
      ];

      const properties = await DBHelper.fetch({
        model: PropertyModel,
        req,
        filters: {
          "owner.ownerId": agencyId,
          "owner.ownerType": OwnerTypeEnum.agency,
          ...(purpose === "1" || purpose === "2" ? { purpose: Number(purpose) } : {}),
          ...categoryFilter,
          ...statusFilter,
          ...locationFilter,
        },
        lookups: pipeline,
        sortBy: sortFilter,
        searchFields: ["propertyInformation.title.en", "propertyInformation.title.ar", "propertyInformation.landmark.en", "propertyInformation.landmark.ar"],
        projection: {
          _id: 1,
          propertyId: 1,
          purpose: 1,
          propertyCategoryId: 1,

          propertyInformation: {
            title: DBHelper.locale(req, "$propertyInformation.title"),
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
            location: {
              longitude: { $arrayElemAt: ["$propertyInformation.location.coordinates", 0] },
              latitude: { $arrayElemAt: ["$propertyInformation.location.coordinates", 1] },
            },
          },
          isFeatured: 1,
          status: 1,
          coverImage: DBHelper.file("$coverImage"),
          createdAt: 1,
          verificationStatus: 1,
        },
      });

      return ResJson.success(res, "Agency properties fetched successfully", properties);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getAgencyPropertyDetails(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const agencyId = req.agency.agencyId;
      const { id } = req.params as TGetPropertyParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        "owner.ownerId": agencyId,
        "owner.ownerType": OwnerTypeEnum.agency,
        // TODO: Add agency team members check
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

      const propertyDetails = {
        _id: property._id,
        purpose: property.purpose,
        propertyId: property.propertyId,
        propertyCategoryId: property.propertyCategoryId,
        propertyInformation: {
          title: property.propertyInformation.title[ReqHelpers.locale(req)],
          titleObject: property.propertyInformation.title,
          description: property.propertyInformation.description[ReqHelpers.locale(req)],
          descriptionObject: property.propertyInformation.description,
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
        status: property.status,
        isFeatured: property.isFeatured,
        createdAt: property.createdAt,
      };

      return ResJson.success(res, "Property details fetched successfully", {
        property: propertyDetails,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async deleteProperty(req: AgencyRequest, res: Response): Promise<void> {
    const session = await PropertyModel.startSession();
    session.startTransaction();

    try {
      const agencyId = req.agency.agencyId;
      const { id } = req.params as TDeletePropertyParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        "owner.ownerType": OwnerTypeEnum.agency,
        "owner.ownerId": new mongoose.Types.ObjectId(agencyId),
        deletedAt: null,
      }).session(session);

      if (!property) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Property not found");
      }

      // Decrement agency count if property was active (verified + enabled)
      if (property.verificationStatus === VerificationStatusEnum.active && property.status === StatusEnum.active && property.purpose) {
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

  async togglePropertyStatus(req: AgencyRequest, res: Response): Promise<void> {
    const session = await PropertyModel.startSession();
    session.startTransaction();

    try {
      const agencyId = req.agency.agencyId;
      const { id } = req.params as TTogglePropertyStatusParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        "owner.ownerType": OwnerTypeEnum.agency,
        "owner.ownerId": new mongoose.Types.ObjectId(agencyId),
        deletedAt: null,
      }).session(session);

      if (!property) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Property not found");
      }

      const wasActive = property.status === StatusEnum.active;
      property.status = wasActive ? StatusEnum.inactive : StatusEnum.active;

      // Update agency count only for verified properties
      if (property.verificationStatus === VerificationStatusEnum.active && property.purpose) {
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

  async togglePropertyFeaturedStatus(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const agencyId = req.agency.agencyId;

      const { id } = req.params as TTogglePropertyFeaturedStatusParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        "owner.ownerType": OwnerTypeEnum.agency,
        "owner.ownerId": new mongoose.Types.ObjectId(agencyId),
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

  async updateProperty(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const agencyId = req.agency.agencyId;
      const { id } = req.params as TUpdatePropertyParams;
      const body = req.body as TUpdatePropertyRequest;

      const { success, property, error } = await PropertyService.updateProperty({
        body,
        req,
        propertyId: id,
        owner: {
          "owner.ownerType": OwnerTypeEnum.agency,
          "owner.ownerId": agencyId,
        },
      });

      if (!success) {
        return ResJson.invalid(res, error || "Failed to update property");
      }

      return ResJson.success(res, property?.verificationStatus === VerificationStatusEnum.draft ? "Property saved as draft" : "Property updated successfully", { property });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getDetailsForPropertyEdit(req: AgencyRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetPropertyParams;

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        "owner.ownerId": req.agency.agencyId,
        "owner.ownerType": OwnerTypeEnum.agency,
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
      const propertyDetails = {
        _id: property._id,
        purpose: property.purpose,
        propertyCategoryId: property.propertyCategoryId,
        propertyInformation: {
          title: property.propertyInformation.title,
          description: property.propertyInformation.description,
          landmark: property.propertyInformation.landmark,
          locationId: property.propertyInformation.locationId,
          city: location ? location.city[ReqHelpers.locale(req)] : null,
          area: property.propertyInformation.area,
          price: property.propertyInformation.price,
          possessionStatus: property.propertyInformation.possessionStatus,
          propertySubCategoryId: property.propertyInformation.propertySubCategoryId,
          propertySubCategoryName: subCategory ? subCategory.name[ReqHelpers.locale(req)] : null,
          latitude: property.propertyInformation.location?.coordinates[0],
          longitude: property.propertyInformation.location?.coordinates[1],
          address: property.propertyInformation.address,
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
        owner: property.owner.ownerId,
        ownerDetails,
      };

      return ResJson.success(res, "Property fetched successfully", {
        property: propertyDetails,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const AppAgencyPropertiesController = new AppAgencyPropertiesControllerClass();
