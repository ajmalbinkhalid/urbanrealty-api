import type { Response } from "express";
import type { PipelineStage } from "mongoose";
import mongoose from "mongoose";
import { AgencyModel } from "@/database/models/AgencyModel";
import { AmenityModel } from "@/database/models/AmenitiesModel";
import { LocationModel } from "@/database/models/LocationModel";
import { getPropertyOwnerDetails, PropertyModel } from "@/database/models/PropertyModel";
import { SubCategoryModel } from "@/database/models/SubCategoryModel";
import { UserModel } from "@/database/models/UserModel";
import { OwnerTypeEnum } from "@/enum/OwnerTypeEnum";
import { PropertySortByEnum } from "@/enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TGetHomePropertyParams, TGetPropertiesByAgencyParams } from "@/routes/app/user/validations/UserHomeValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { FileHelper } from "@/utils/file-helpers";
import { ReqHelpers } from "@/utils/req-helper";
import { ResJson } from "@/utils/response-json";

class UserAppHomepageControllerClass {
  async getLocations(req: UserRequest, res: Response): Promise<void> {
    try {
      const locations = await DBHelper.fetch({
        model: LocationModel,
        req,
        searchFields: [DBHelper.locale(req, "city")],
        filters: { status: StatusEnum.active, deletedAt: null },
        projection: { city: DBHelper.locale(req, "$city"), _id: 1 },
        noPagination: true,
      });
      ResJson.success(res, "Location fetch successful", locations);
      return;
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getSubCategories(req: UserRequest, res: Response): Promise<void> {
    try {
      const filters = {
        status: StatusEnum.active,
        deletedAt: null,
      } as Record<string, unknown>;

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
        noPagination: true,
      });

      ResJson.success(res, "Sub categories fetched successfully", subCategories);
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getAllProperty(req: UserRequest, res: Response): Promise<void> {
    try {
      const { purpose, city, subcategoryId, minPrice, maxPrice, beds, baths, category } = req.query;

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
        {
          $lookup: {
            from: UserModel.collection.name,
            localField: "owner.ownerId",
            foreignField: "_id",
            as: "userOwnerData",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: { $concat: ["$firstName", " ", "$lastName"] },
                  email: 1,
                  //   phone: "$phoneNumber",
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: AgencyModel.collection.name,
            localField: "owner.ownerId",
            foreignField: "_id",
            as: "agencyOwnerData",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: "$companyName",
                  email: "$companyEmail",
                  //   phone: "$companyPhone",
                },
              },
            ],
          },
        },
      ];

      // Build dynamic filters
      const filters: Record<string, unknown> = {
        status: StatusEnum.active,
        verificationStatus: VerificationStatusEnum.active,
      };

      if (purpose) {
        filters.purpose = Number(purpose);
      }

      if (city) {
        const cityId = Array.isArray(city) ? city[0] : city;
        if (typeof cityId === "string") {
          filters["propertyInformation.locationId"] = new mongoose.Types.ObjectId(cityId);
        }
      }

      if (subcategoryId) {
        const subCatId = Array.isArray(subcategoryId) ? subcategoryId[0] : subcategoryId;
        if (typeof subCatId === "string") {
          filters["propertyInformation.propertySubCategoryId"] = new mongoose.Types.ObjectId(subCatId);
        }
      }

      if (category) {
        filters.propertyCategoryId = Number(category);
      }

      if (minPrice || maxPrice) {
        const priceConditions: Record<string, unknown>[] = [];

        if (minPrice) {
          priceConditions.push({ $gte: [{ $toDouble: "$propertyInformation.price" }, Number(minPrice)] });
        }

        if (maxPrice) {
          priceConditions.push({ $lte: [{ $toDouble: "$propertyInformation.price" }, Number(maxPrice)] });
        }

        pipeline.push({
          $match: {
            $expr: {
              $and: priceConditions,
            },
          },
        } as PipelineStage);
      }

      // Build bedroom and bathroom filters (only for propertyCategoryId 2)
      const bedroomBathroomMatch: Record<string, unknown>[] = [];

      if (beds || baths) {
        pipeline.push({
          $match: {
            propertyCategoryId: 1,
          },
        } as PipelineStage);

        if (beds) {
          const bedroomsValue = Number(beds);
          if (bedroomsValue === 9) {
            bedroomBathroomMatch.push({ $gte: ["$keyFeatures.noOfBedroom", 9] });
          } else {
            bedroomBathroomMatch.push({ $eq: ["$keyFeatures.noOfBedroom", bedroomsValue] });
          }
        }

        if (baths) {
          const bathroomsValue = Number(baths);
          if (bathroomsValue === 9) {
            bedroomBathroomMatch.push({ $gte: ["$keyFeatures.noOfBathroom", 9] });
          } else {
            bedroomBathroomMatch.push({ $eq: ["$keyFeatures.noOfBathroom", bathroomsValue] });
          }
        }
      }

      if (bedroomBathroomMatch.length > 0) {
        pipeline.push({
          $match: {
            $expr: {
              $and: bedroomBathroomMatch,
            },
          },
        } as PipelineStage);
      }

      const properties = await DBHelper.fetch({
        model: PropertyModel,
        req,
        noPagination: true,
        filters,
        searchFields: ["propertyInformation.title.en", "propertyInformation.title.ar", "propertyInformation.landmark.en", "propertyInformation.landmark.ar"],
        lookups: pipeline,
        projection: {
          _id: 1,
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
            // location: {
            longitude: { $arrayElemAt: ["$propertyInformation.location.coordinates", 0] },
            latitude: { $arrayElemAt: ["$propertyInformation.location.coordinates", 1] },
            // },
          },
          keyFeatures: 1,
          isFeatured: 1,
          status: 1,
          coverImage: DBHelper.file("$coverImage"),
          createdAt: 1,
          verificationStatus: 1,
          owner: 1,
        },
      });

      const propertiesWithOwnerDetails = await Promise.all(
        properties.items.map(async (property) => ({
          ...property,
          ownerDetails: await getPropertyOwnerDetails(property.owner),
        }))
      );

      return ResJson.success(res, "Properties fetched successfully", {
        ...properties,
        items: propertiesWithOwnerDetails,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getPropertyDetails(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetHomePropertyParams;

      // Increment viewed count
      await PropertyModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), { $inc: { viewed: 1 } });

      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        verificationStatus: VerificationStatusEnum.active,
        status: StatusEnum.active,
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
        // deletedAt: null,
      }).lean();

      // Fetch similar properties from the same owner
      const similarProperties = await PropertyModel.find({
        _id: { $ne: property._id },
        "owner.ownerType": property.owner.ownerType,
        "owner.ownerId": property.owner.ownerId,
        status: StatusEnum.active,
        verificationStatus: VerificationStatusEnum.active,
        deletedAt: null,
      })
        .limit(6)
        .lean();

      const locale = ReqHelpers.locale(req);
      const similarSubCategoryIds = Array.from(
        new Set(similarProperties.map((prop) => prop.propertyInformation.propertySubCategoryId).filter((subCategoryId): subCategoryId is mongoose.Types.ObjectId => subCategoryId !== null && subCategoryId !== undefined))
      );

      const similarSubCategories = await SubCategoryModel.find({
        _id: { $in: similarSubCategoryIds },
        deletedAt: null,
      }).lean();

      const similarSubCategoryMap = new Map(similarSubCategories.map((subCategory) => [subCategory._id.toString(), subCategory.name[locale]]));

      const ownerDetails = await getPropertyOwnerDetails(property.owner);
      const propertyDetails = {
        _id: property._id,
        propertyId: property.propertyId,
        purpose: property.purpose,
        propertyCategoryId: property.propertyCategoryId,
        propertyInformation: {
          title: property.propertyInformation.title[locale],
          description: property.propertyInformation.description[locale],
          landmark: property.propertyInformation.landmark[locale],
          locationId: property.propertyInformation.locationId,
          locationName: location ? location.city[locale] : null,
          area: property.propertyInformation.area,
          price: property.propertyInformation.price,
          possessionStatus: property.propertyInformation.possessionStatus,
          propertySubCategoryId: property.propertyInformation.propertySubCategoryId,
          propertySubCategoryName: subCategory ? subCategory.name[locale] : null,
          longitude: property?.propertyInformation?.location?.coordinates[0],
          latitude: property?.propertyInformation?.location?.coordinates[1],
        },
        keyFeatures: property.keyFeatures,
        amenitiesId: property.amenitiesId,
        amenities: amenities.map((amenity) => ({
          _id: amenity._id,
          name: amenity.name[locale],
          icon: amenity.icon ? FileHelper.getUrl(amenity.icon) : null,
        })),
        coverImage: property.coverImage ? FileHelper.getUrl(property.coverImage) : null,
        galleryImages: property.galleryImages.map((img) => (img ? FileHelper.getUrl(img) : null)),
        verificationStatus: property.verificationStatus,
        verifiedAt: property.verifiedAt,
        verifiedBy: property.verifiedBy,
        status: property.status,
        isFeatured: property.isFeatured,
        createdAt: property.createdAt,
        owner: property.owner.ownerId,
        ownerDetails,
      };

      const similar = await Promise.all(
        similarProperties.map(async (prop) => {
          const ownerDetails = await getPropertyOwnerDetails(prop.owner);
          return {
            _id: prop._id,
            purpose: prop.purpose,
            propertyCategoryId: prop.propertyCategoryId,
            propertyInformation: {
              title: prop.propertyInformation.title[locale],
              landmark: prop.propertyInformation.landmark[locale],
              locationId: prop.propertyInformation.locationId,
              locationName: location ? location.city[locale] : null,
              area: prop.propertyInformation.area,
              propertySubCategoryId: prop.propertyInformation.propertySubCategoryId,
              propertySubCategoryName: prop.propertyInformation.propertySubCategoryId ? (similarSubCategoryMap.get(prop.propertyInformation.propertySubCategoryId.toString()) ?? null) : null,
              price: prop.propertyInformation.price,
            },
            keyFeatures: prop.keyFeatures,
            isFeatured: prop.isFeatured,
            status: prop.status,
            coverImage: prop.coverImage ? FileHelper.getUrl(prop.coverImage) : null,
            createdAt: prop.createdAt,
            verificationStatus: prop.verificationStatus,
            ownerDetails,
          };
        })
      );

      return ResJson.success(res, "Property fetched successfully", {
        property: propertyDetails,
        similarProperties: similar,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getPropertiesByAgency(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetPropertiesByAgencyParams;
      const { sortBy, category, purpose, city, subcategoryId } = req.query;

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
        {
          $lookup: {
            from: UserModel.collection.name,
            localField: "owner.ownerId",
            foreignField: "_id",
            as: "userOwnerData",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: { $concat: ["$firstName", " ", "$lastName"] },
                  email: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: AgencyModel.collection.name,
            localField: "owner.ownerId",
            foreignField: "_id",
            as: "agencyOwnerData",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: "$companyName",
                  email: "$companyEmail",
                },
              },
            ],
          },
        },
      ];

      const filters: Record<string, unknown> = {
        "owner.ownerType": OwnerTypeEnum.agency,
        "owner.ownerId": new mongoose.Types.ObjectId(id),
        status: StatusEnum.active,
        verificationStatus: VerificationStatusEnum.active,
        deletedAt: null,
      };

      if (category) {
        filters.propertyCategoryId = Number(category);
      }

      if (purpose) {
        filters.purpose = Number(purpose);
      }

      if (city) {
        const cityId = Array.isArray(city) ? city[0] : city;
        if (typeof cityId === "string") {
          filters["propertyInformation.locationId"] = new mongoose.Types.ObjectId(cityId);
        }
      }

      if (subcategoryId) {
        const subCatId = Array.isArray(subcategoryId) ? subcategoryId[0] : subcategoryId;
        if (typeof subCatId === "string") {
          filters["propertyInformation.propertySubCategoryId"] = new mongoose.Types.ObjectId(subCatId);
        }
      }

      // Determine sort order
      let sortByField: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest first
      const sortByNum = sortBy ? Number(sortBy) : null;

      if (sortByNum === PropertySortByEnum.Popular) {
        sortByField = { viewed: -1 };
      } else if (sortByNum === PropertySortByEnum.Oldest) {
        sortByField = { createdAt: 1 };
      } else if (sortByNum === PropertySortByEnum.Newest) {
        sortByField = { createdAt: -1 };
      } else if (sortByNum === PropertySortByEnum.Highest_price) {
        pipeline.push({
          $addFields: {
            priceNumeric: { $toDouble: "$propertyInformation.price" },
          },
        } as PipelineStage);
        sortByField = { priceNumeric: -1 };
      } else if (sortByNum === PropertySortByEnum.Lowest_price) {
        pipeline.push({
          $addFields: {
            priceNumeric: { $toDouble: "$propertyInformation.price" },
          },
        } as PipelineStage);
        sortByField = { priceNumeric: 1 };
      }

      const properties = await DBHelper.fetch({
        model: PropertyModel,
        req,
        filters,
        searchFields: ["propertyInformation.title.en", "propertyInformation.title.ar", "propertyInformation.landmark.en", "propertyInformation.landmark.ar"],
        lookups: pipeline,
        sortBy: sortByField,
        projection: {
          _id: 1,
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
          keyFeatures: 1,
          isFeatured: 1,
          status: 1,
          coverImage: DBHelper.file("$coverImage"),
          createdAt: 1,
          verificationStatus: 1,
          owner: 1,
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
        },
      });

      return ResJson.success(res, "Agency properties fetched successfully", properties);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const UserAppHomepageController = new UserAppHomepageControllerClass();
