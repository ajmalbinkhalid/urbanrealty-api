import mongoose, { type ClientSession } from "mongoose";
import { getNextSequence } from "@/database/models/CounterModel";
import { getPropertyOwner, PropertyModel, type TPropertyModel } from "@/database/models/PropertyModel";
import type { TCustomerShipEnum, TFurnishingEnum, TLocationHubEnum, TPropertyConditionEnum, TZoneTypeEnum } from "@/enum/PropertyEnum";
import { StatusEnum, type TVerificationStatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { TCreatePropertyRequest, TUpdatePropertyRequest } from "@/routes/dashboard/validations/PropertyRouterValidation";
import type { AdminRequest } from "@/types/admin-type";
import type { AgencyRequest } from "@/types/agency-type";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { type CustomFile, FileHelper } from "@/utils/file-helpers";

type RequestType = UserRequest | AgencyRequest | AdminRequest;

type CreatePropertyInput = {
  body: TCreatePropertyRequest;
  req: RequestType;
  session: ClientSession;
  isDraft?: boolean;
  verificationStatus?: TVerificationStatusEnum;
};

type CreatePropertyResult = {
  success: boolean;
  property?: TPropertyModel;
  error?: string;
};

type UpdatePropertyInput = {
  propertyId: string;
  body: TUpdatePropertyRequest;
  req: RequestType;
  isAdmin?: boolean;
  owner?: {
    "owner.ownerType": TPropertyModel["owner"]["ownerType"];
    "owner.ownerId": mongoose.Types.ObjectId;
  };
};

type UpdatePropertyResult = {
  success: boolean;
  property?: TPropertyModel;
  error?: string;
};

class PropertyServiceClass {
  /**
   * Processes key features based on property category
   * Converts dynamic key features to category-specific format
   */
  private buildKeyFeatures(propertyCategoryId: string, keyFeatures: unknown | undefined): TPropertyModel["keyFeatures"] {
    const defaultKeyFeatures: TPropertyModel["keyFeatures"] = {
      propertyAge: null,
      noOfBedroom: null,
      noOfBathroom: null,
      furnishing: null,
      totalFloor: null,
      floorNumber: null,
      customerShip: null,
      propertyCondition: null,
      zoneType: null,
      locationHub: null,
    };

    if (!keyFeatures) {
      return defaultKeyFeatures;
    }

    const kf = keyFeatures as {
      propertyAge?: number;
      noOfBedroom?: number;
      noOfBathroom?: number;
      furnishing?: TFurnishingEnum;
      totalFloor?: string;
      floorNumber?: string;
      customerShip?: TCustomerShipEnum;
      propertyCondition?: TPropertyConditionEnum;
      zoneType?: TZoneTypeEnum;
      locationHub?: TLocationHubEnum;
    };

    // RESIDENTIAL
    if (propertyCategoryId === "1") {
      return {
        propertyAge: kf.propertyAge,
        noOfBedroom: kf.noOfBedroom,
        noOfBathroom: kf.noOfBathroom,
        furnishing: kf.furnishing,
      };
    }

    // COMMERCIAL
    if (propertyCategoryId === "2") {
      return {
        propertyAge: kf.propertyAge,
        totalFloor: kf.totalFloor,
        floorNumber: kf.floorNumber,
        customerShip: kf.customerShip,
        propertyCondition: kf.propertyCondition,
        zoneType: kf.zoneType,
        locationHub: kf.locationHub,
        furnishing: kf.furnishing,
      };
    }

    // LAND (no additional key features)
    return defaultKeyFeatures;
  }

  /**
   * Converts amenity IDs to ObjectIds
   */
  private buildAmenitiesIds(propertyCategoryId: string, amenitiesData: string[] | undefined): TPropertyModel["amenitiesId"] {
    if (!amenitiesData || propertyCategoryId === "3") {
      return [];
    }
    return amenitiesData.map((id) => new mongoose.Types.ObjectId(id));
  }

  /**
   * Uploads and processes cover image
   */
  private uploadCoverImage(coverImage: CustomFile): { success: boolean; filePath?: string; error?: string } {
    const uploadResult = FileHelper.uploadFile(coverImage, {
      folder: "properties/cover-images",
      prefix: "property-cover-image",
    });

    if (!uploadResult.success) {
      return { success: false, error: "Cover image upload failed" };
    }

    return { success: true, filePath: uploadResult.filePath };
  }

  /**
   * Uploads and processes gallery images
   */
  private uploadGalleryImages(galleryImages: CustomFile[]): { success: boolean; filePaths?: string[]; error?: string } {
    const galleryFileImages: string[] = [];

    for (const image of galleryImages) {
      const uploadResult = FileHelper.uploadFile(image, {
        folder: "properties/gallery-images",
        prefix: "property-gallery-image",
      });

      if (!uploadResult.success) {
        return { success: false, error: "Gallery image upload failed" };
      }

      galleryFileImages.push(uploadResult.filePath as string);
    }

    return { success: true, filePaths: galleryFileImages };
  }

  /**
   * Checks if property already exists by title (both languages)
   */
  private async checkPropertyExists(title: TCreatePropertyRequest["propertyInformation"]["title"], session: ClientSession): Promise<boolean> {
    const exists = await PropertyModel.findOne({
      "propertyInformation.title.en": title.en,
      "propertyInformation.title.ar": title.ar,
      deletedAt: null,
    })
      .session(session)
      .lean();

    return !!exists;
  }

  /**
   * Builds the property information object
   */
  private buildPropertyInformation(body: TCreatePropertyRequest): TPropertyModel["propertyInformation"] {
    return {
      title: body.propertyInformation.title,
      description: body.propertyInformation.description,
      landmark: body.propertyInformation.landmark,
      locationId: new mongoose.Types.ObjectId(body.propertyInformation.locationId),
      address: body.propertyInformation.address,
      location: {
        type: "Point",
        coordinates: [body.propertyInformation.location.longitude, body.propertyInformation.location.latitude],
      },
      area: body.propertyInformation.area,
      price: body.propertyInformation.price,
      possessionStatus: body.propertyInformation.possessionStatus,
      propertySubCategoryId: body.propertyInformation.propertySubCategoryId ? new mongoose.Types.ObjectId(body.propertyInformation.propertySubCategoryId) : null,
    };
  }

  /**
   * Creates a new property with all validations and file uploads
   * Supports different verification statuses based on user type
   */
  async createProperty(input: CreatePropertyInput): Promise<CreatePropertyResult> {
    const { body, req, session, isDraft = false, verificationStatus } = input;

    try {
      // Check if property already exists
      const propertyExists = await this.checkPropertyExists(body.propertyInformation.title, session);
      if (propertyExists) {
        return { success: false, error: "Property already exists" };
      }

      // Build key features based on property category
      const finalKeyFeatures = this.buildKeyFeatures(body.propertyCategoryId, "keyFeatures" in body ? body.keyFeatures : undefined);

      // Build amenities IDs
      const amenitiesIds = this.buildAmenitiesIds(body.propertyCategoryId, "amenities" in body ? body.amenities : undefined);

      // Upload cover image
      const coverImageResult = this.uploadCoverImage(body.coverImage);
      if (!coverImageResult.success) {
        return { success: false, error: coverImageResult.error };
      }

      // Upload gallery images
      const galleryResult = this.uploadGalleryImages(body["galleryImages[]"]);
      if (!galleryResult.success) {
        return { success: false, error: galleryResult.error };
      }

      // Get next property ID
      const propertyId = await getNextSequence("propertyId", session);

      // Determine verification status
      let finalVerificationStatus = verificationStatus;
      if (finalVerificationStatus === undefined) {
        if (isDraft) {
          finalVerificationStatus = VerificationStatusEnum.draft;
        } else {
          finalVerificationStatus = VerificationStatusEnum.pending;
        }
      }

      // Create property document
      const property = await PropertyModel.create(
        [
          {
            propertyId,
            purpose: body.purpose,
            propertyCategoryId: Number(body.propertyCategoryId) as TPropertyModel["propertyCategoryId"],
            propertyInformation: this.buildPropertyInformation(body),
            keyFeatures: finalKeyFeatures,
            amenitiesId: amenitiesIds,
            coverImage: coverImageResult.filePath as string,
            galleryImages: galleryResult.filePaths as string[],
            verificationStatus: finalVerificationStatus as TPropertyModel["verificationStatus"],
            owner: getPropertyOwner(req),
            status: StatusEnum.inactive,
            createdBy: DBHelper.actor(req),
          },
        ],
        { session }
      );

      return { success: true, property: property[0] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**   * Processes image uploads and deletions for property updates
   */
  private processImageUpdates(
    coverImage: CustomFile | undefined,
    galleryImages: CustomFile[] | undefined,
    galleryImagePaths: string[] | undefined,
    property: TPropertyModel
  ): { coverImagePath: string; galleryImagePaths: string[]; imagesToDelete: string[]; errors?: string } {
    let coverImagePath = property.coverImage;
    const allImagePaths: string[] = [];
    const imagesToDelete: string[] = [];

    // Handle cover image upload if provided
    if (coverImage) {
      const coverImageUpload = FileHelper.uploadFile(coverImage, {
        folder: "properties/cover-images",
        prefix: "property-cover-image",
      });

      if (coverImageUpload.success === false) {
        return { coverImagePath: property.coverImage, galleryImagePaths: property.galleryImages as string[], imagesToDelete: [], errors: coverImageUpload.error };
      }

      if (coverImageUpload.success && property.coverImage) {
        imagesToDelete.push(property.coverImage);
      }
      if (coverImageUpload.success) {
        coverImagePath = coverImageUpload.filePath as string;
      }
    }

    // Handle gallery images
    if (galleryImagePaths && Array.isArray(galleryImagePaths)) {
      const sentPaths = new Set(galleryImagePaths);
      for (const existingImage of property.galleryImages || []) {
        if (sentPaths.has(existingImage)) {
          allImagePaths.push(existingImage);
        } else {
          imagesToDelete.push(existingImage);
        }
      }
    }

    if (galleryImages && Array.isArray(galleryImages)) {
      for (const image of galleryImages) {
        const uploadResult = FileHelper.uploadFile(image as CustomFile, {
          folder: "properties/gallery-images",
          prefix: "property-gallery-image",
        });

        if (uploadResult.success) {
          allImagePaths.push(uploadResult.filePath as string);
        }

        if (!uploadResult.success) {
          return { coverImagePath, galleryImagePaths: allImagePaths, imagesToDelete: [], errors: uploadResult.error };
        }
      }
    }

    return { coverImagePath, galleryImagePaths: allImagePaths, imagesToDelete };
  }

  /**   * Updates an existing property with field restrictions based on user type and publication status
   *
   * Admin: Can update all fields
   * User/Agency:
   *   - If draft: Can update all fields
   *   - If published: Cannot update purpose, propertyInformation, propertyCategoryId
   */
  async updateProperty(input: UpdatePropertyInput): Promise<UpdatePropertyResult> {
    const { propertyId, body, req, isAdmin = false } = input;

    try {
      const property = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(propertyId),
        deletedAt: null,
        ...(input.owner ?? {}),
      });

      if (!property) {
        return { success: false, error: "Property not found" };
      }

      if (property.verificationStatus === VerificationStatusEnum.pending && !isAdmin) {
        return { success: false, error: "Unable to edit property while verification status is pending." };
      }

      //   // Check if property is published (not in draft status)
      //   const isPublished = property.verificationStatus !== VerificationStatusEnum.draft;
      //   const isRestrictedUser = !isAdmin;
      //   const hasRestriction = isRestrictedUser && isPublished;

      const finalKeyFeatures = this.buildKeyFeatures(body.propertyCategoryId, "keyFeatures" in body ? body.keyFeatures : undefined);

      // Build amenities IDs
      const amenitiesIds = this.buildAmenitiesIds(body.propertyCategoryId, "amenities" in body ? body.amenities : undefined);

      // Process image updates using helper method
      const { coverImagePath, galleryImagePaths, imagesToDelete, errors } = this.processImageUpdates(body.coverImage, body["galleryImages[]"], body["galleryImagePaths[]"], property);

      if (errors) {
        return { success: false, error: errors };
      }

      property.purpose = body.purpose;

      property.propertyCategoryId = Number(body.propertyCategoryId) as TPropertyModel["propertyCategoryId"];

      const propInfo = body.propertyInformation;
      const location = propInfo.location;
      property.propertyInformation = {
        title: propInfo.title,
        description: propInfo.description,
        landmark: propInfo.landmark,
        locationId: new mongoose.Types.ObjectId(propInfo.locationId),
        address: propInfo.address,
        location: {
          type: "Point",
          coordinates: [location.longitude, location.latitude],
        },
        area: propInfo.area,
        price: propInfo.price,
        possessionStatus: propInfo.possessionStatus,
        propertySubCategoryId: propInfo.propertySubCategoryId ? new mongoose.Types.ObjectId(propInfo.propertySubCategoryId) : null,
      };

      property.keyFeatures = finalKeyFeatures;
      property.amenitiesId = amenitiesIds;
      property.coverImage = coverImagePath;
      property.galleryImages = galleryImagePaths;
      property.updatedBy = DBHelper.actor(req);
      // Update verification status for draft changes by users/agencies
      if (!isAdmin && (property.verificationStatus === VerificationStatusEnum.draft || VerificationStatusEnum.reject) && body.isDraft !== true) {
        property.verificationStatus = VerificationStatusEnum.pending;
      }
      if (!isAdmin && property.verificationStatus === VerificationStatusEnum.reject && body.isDraft === true) {
        property.verificationStatus = VerificationStatusEnum.draft;
      }

      await property.save();

      // Delete old images after successful save
      for (const imageToDelete of imagesToDelete) {
        FileHelper.deleteFile(imageToDelete);
      }

      return { success: true, property };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
}

export const PropertyService = new PropertyServiceClass();
