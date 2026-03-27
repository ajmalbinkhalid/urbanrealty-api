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
import { PropertyPurposeEnum, PropertySortByEnum, SortDirectionEnum } from "@/enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TGetHomeAgencyParams, TGetHomePropertyParams, TGetPropertiesByAgencyParams, TRecentlyViewedPropertiesBody } from "@/routes/website/user/validations/UserHomeValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { FileHelper } from "@/utils/file-helpers";
import { ReqHelpers } from "@/utils/req-helper";
import { ResJson } from "@/utils/response-json";

class WebUserHomepageControllerClass {
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
          $lookup: { from: LocationModel.collection.name, localField: "locationId", foreignField: "_id", as: "locationDetails" },
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
            locationId: 1,
            locationName: {
              $cond: [{ $gt: [{ $size: "$locationDetails" }, 0] }, { $arrayElemAt: [`$locationDetails.city.${ReqHelpers.locale(req)}`, 0] }, null],
            },
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

  async getAllAgencies(req: UserRequest, res: Response): Promise<void> {
    try {
      const { city, sortDirection } = req.query;

      const sortDir = sortDirection ? Number(sortDirection) : SortDirectionEnum.Ascending;
      const sortByField = { companyName: (sortDir === SortDirectionEnum.Descending ? -1 : 1) as 1 | -1 };

      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: LocationModel.collection.name,
            localField: "locationId",
            foreignField: "_id",
            as: "locationDetails",
          },
        },
      ];

      // Build dynamic filters
      const filters: Record<string, unknown> = {
        status: StatusEnum.active,
        verificationStatus: VerificationStatusEnum.active,
      };

      if (city) {
        const cityId = Array.isArray(city) ? city[0] : city;
        if (typeof cityId === "string") {
          filters.locationId = new mongoose.Types.ObjectId(cityId);
        }
      }

      const properties = await DBHelper.fetch({
        model: AgencyModel,
        req,
        filters,
        searchFields: ["companyName"],
        lookups: pipeline,
        sortBy: sortByField,
        projection: {
          _id: 1,
          agencyId: 1,
          companyName: 1,
          cRNumber: 1,
          companyLogo: DBHelper.file("$companyLogo"),
          coverImage: DBHelper.file("$coverImage"),
          companyEmail: 1,
          companyPhone: 1,
          companyWhatsapp: 1,
          propertyCategoryId: 1,
          about: 1,
          isFeatured: 1,
          status: 1,
          createdAt: 1,
          locationId: 1,
          locationDetails: "$locationDetails",
          activeSalePropertiesCount: 1,
          activeRentPropertiesCount: 1,
        },
      });

      return ResJson.success(res, "Agencies fetched successfully", properties);
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getLocations(req: UserRequest, res: Response): Promise<void> {
    try {
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: PropertyModel.collection.name,
            let: { locationId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$propertyInformation.locationId", "$$locationId"] }, { $eq: ["$status", StatusEnum.active] }, { $eq: ["$deletedAt", null] }],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalProperties: { $sum: 1 },
                  propertiesForSale: {
                    $sum: {
                      $cond: [{ $eq: ["$purpose", PropertyPurposeEnum.Sell] }, 1, 0],
                    },
                  },
                  propertiesForRent: {
                    $sum: {
                      $cond: [{ $eq: ["$purpose", PropertyPurposeEnum.Rent] }, 1, 0],
                    },
                  },
                },
              },
            ],
            as: "propertyCounts",
          },
        },
      ];

      const locations = await DBHelper.fetch({
        model: LocationModel,
        req,
        searchFields: [DBHelper.locale(req, "city")],
        filters: { status: StatusEnum.active, deletedAt: null },
        lookups: pipeline,
        projection: {
          city: DBHelper.locale(req, "$city"),
          _id: 1,
          totalProperties: {
            $ifNull: [{ $arrayElemAt: ["$propertyCounts.totalProperties", 0] }, 0],
          },
          propertiesForSale: {
            $ifNull: [{ $arrayElemAt: ["$propertyCounts.propertiesForSale", 0] }, 0],
          },
          propertiesForRent: {
            $ifNull: [{ $arrayElemAt: ["$propertyCounts.propertiesForRent", 0] }, 0],
          },
        },
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

  async getFeaturedProperties(req: UserRequest, res: Response): Promise<void> {
    try {
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
        status: StatusEnum.active,
        verificationStatus: VerificationStatusEnum.active,
        isFeatured: true,
        deletedAt: null,
      };

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
          propertyId: 1,
          propertyCategoryId: 1,

          propertyInformation: {
            title: DBHelper.locale(req, "$propertyInformation.title"),
            landmark: DBHelper.locale(req, "$propertyInformation.landmark"),
            locationId: 1,
            area: 1,
            address: 1,
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

      return ResJson.success(res, "Featured properties fetched successfully", properties);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getAllProperty(req: UserRequest, res: Response): Promise<void> {
    try {
      const { purpose, city, subcategoryId, minPrice, maxPrice, beds, baths, sortBy } = req.query;

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

      // Build bedroom and bathroom filters
      if (beds || baths) {
        const bedroomBathroomMatch: Record<string, unknown>[] = [];

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

        if (bedroomBathroomMatch.length > 0) {
          pipeline.push({
            $match: {
              $expr: {
                $and: bedroomBathroomMatch,
              },
            },
          } as PipelineStage);
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
        // noPagination: true,
        filters,
        searchFields: ["propertyInformation.title.en", "propertyInformation.title.ar", "propertyInformation.landmark.en", "propertyInformation.landmark.ar"],
        lookups: pipeline,
        sortBy: sortByField,
        projection: {
          _id: 1,
          purpose: 1,
          propertyId: 1,
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

      return ResJson.success(res, "Properties fetched successfully", properties);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getPropertyDetails(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetHomePropertyParams;

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
        deletedAt: null,
      }).lean();

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

      // Fetch similar properties from the same owner
      const similarProperties = await PropertyModel.aggregate([
        {
          $match: {
            _id: { $ne: property._id },
            status: StatusEnum.active,
            propertyCategoryId: property.propertyCategoryId,
            verificationStatus: VerificationStatusEnum.active,
            deletedAt: null,
          },
        },
        ...pipeline,
        {
          $project: {
            _id: 1,
            purpose: 1,
            propertyId: 1,
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
        },
        {
          $limit: 2,
        },
      ]).exec();

      const ownerDetails = await getPropertyOwnerDetails(property.owner);
      const propertyDetails = {
        _id: property._id,
        purpose: property.purpose,
        propertyId: property.propertyId,
        propertyCategoryId: property.propertyCategoryId,
        propertyInformation: {
          title: property.propertyInformation.title[ReqHelpers.locale(req)],
          description: property.propertyInformation.description[ReqHelpers.locale(req)],
          landmark: property.propertyInformation.landmark[ReqHelpers.locale(req)],
          locationId: property.propertyInformation.locationId,
          locationName: location ? location.city[ReqHelpers.locale(req)] : null,
          area: property.propertyInformation.area,
          price: property.propertyInformation.price,
          possessionStatus: property.propertyInformation.possessionStatus,
          propertySubCategoryId: property.propertyInformation.propertySubCategoryId,
          propertySubCategoryName: subCategory ? subCategory.name[ReqHelpers.locale(req)] : null,
          location: property.propertyInformation.location,
          address: property.propertyInformation.address,
        },
        keyFeatures: property.keyFeatures,
        amenitiesId: property.amenitiesId,
        amenities: amenities.map((amenity) => ({
          _id: amenity._id,
          name: amenity.name[ReqHelpers.locale(req)],
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
        similarProperties,
      };

      return ResJson.success(res, "Property fetched successfully", {
        property: propertyDetails,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getAgencyDetails(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetHomeAgencyParams;

      const agency = await AgencyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        verificationStatus: VerificationStatusEnum.active,
        status: StatusEnum.active,
        deletedAt: null,
      }).lean();

      if (!agency) {
        return ResJson.notFound(res, "Agency not found");
      }

      const location = await LocationModel.findOne({
        _id: agency.locationId,
        deletedAt: null,
      }).lean();

      const agencyDetails = {
        _id: agency._id,
        agencyId: agency.agencyId,
        companyName: agency.companyName,
        cRNumber: agency.cRNumber,
        companyLogo: agency.companyLogo ? FileHelper.getUrl(agency.companyLogo) : null,
        coverImage: agency.coverImage ? FileHelper.getUrl(agency.coverImage) : null,
        companyEmail: agency.companyEmail,
        companyPhone: agency.companyPhone,
        companyWhatsapp: agency.companyWhatsapp,
        about: agency.about ? agency.about[ReqHelpers.locale(req)] : "",
        isFeatured: agency.isFeatured,
        status: agency.status,
        createdAt: agency.createdAt,
        locationId: agency.locationId,
        locationName: location ? location.city[ReqHelpers.locale(req)] : null,
        totalPropertyCount: agency.activeSalePropertiesCount + agency.activeRentPropertiesCount,
        salePropertyCount: agency.activeSalePropertiesCount,
        rentPropertyCount: agency.activeRentPropertiesCount,
      };

      return ResJson.success(res, "Agency details fetched successfully", {
        agency: agencyDetails,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getPropertiesByAgency(req: UserRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetPropertiesByAgencyParams;
      const { sortBy, category } = req.query;

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
          propertyId: 1,
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

  async recentlyViewedProperties(req: UserRequest, res: Response): Promise<void> {
    try {
      const { propertyIds } = req.body as TRecentlyViewedPropertiesBody;

      let objectIds = propertyIds.map((id) => new mongoose.Types.ObjectId(id));

      if (req.user) {
        const userId = new mongoose.Types.ObjectId(req.user.userId);

        // First, remove these property IDs if they already exist to avoid duplicates
        await UserModel.findByIdAndUpdate(userId, {
          $pull: {
            recentlyViewedProperties: { $in: objectIds },
          },
        });

        // Then add them at the beginning (keep last 20)
        await UserModel.findByIdAndUpdate(
          userId,
          {
            $push: {
              recentlyViewedProperties: {
                $each: objectIds,
                $position: 0,
                $slice: 20,
              },
            },
          },
          { new: true }
        );

        // Fetch user's recently viewed properties
        const user = await UserModel.findById(userId).select("recentlyViewedProperties").lean();

        if (!user?.recentlyViewedProperties || user.recentlyViewedProperties.length === 0) {
          return ResJson.success(res, "No recently viewed properties found", { properties: [] });
        }

        objectIds = user.recentlyViewedProperties;
      }

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

      // Fetch similar properties from the same owner
      const properties = await PropertyModel.aggregate([
        {
          $match: {
            _id: { $in: objectIds },
            status: StatusEnum.active,
            verificationStatus: VerificationStatusEnum.active,
            deletedAt: null,
          },
        },
        ...pipeline,
        {
          $project: {
            _id: 1,
            purpose: 1,
            propertyId: 1,
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
        },
        {
          $limit: 5,
        },
      ]).exec();

      return ResJson.success(res, "Recently viewed properties fetched successfully", { properties });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const WebUserHomepageController = new WebUserHomepageControllerClass();
