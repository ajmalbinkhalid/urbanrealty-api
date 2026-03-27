import { DBHelper } from "@utils/db-helpers";
import { ResJson } from "@utils/response-json";
import type { Response } from "express";
import { AmenityModel, type TAmenityModel } from "@/database/models/AmenitiesModel";
import { getNextSequence } from "@/database/models/CounterModel";
import { StatusEnum } from "@/enum/StatusEnum";
import type { TCreateAmenityRequest, TDeleteAmenityParams, TGetAmenityParams, TToggleStatusParams, TUpdateAmenityParams, TUpdateAmenityRequest } from "@/routes/dashboard/validations/AmenityRouterValidation";
import type { AdminRequest } from "@/types/admin-type";
import { FileHelper } from "@/utils/file-helpers";

class AmenityControllerClass {
  static getAmenity(amenity: TAmenityModel): Record<string, unknown> {
    return {
      _id: amenity._id,
      name: {
        en: amenity.name.en,
        ar: amenity.name.ar,
      },
      icon: FileHelper.getUrl(amenity.icon),
      status: amenity.status,
      createdAt: amenity.createdAt,
      createdBy: amenity.createdBy,
    };
  }
  async createAmenity(req: AdminRequest, res: Response): Promise<void> {
    const session = await AmenityModel.startSession();
    session.startTransaction();

    try {
      const { name, icon } = req.body as TCreateAmenityRequest;

      const exists = await AmenityModel.findOne({
        $or: [{ "name.ar": name.ar }, { "name.en": name.en }],
        deletedAt: null,
      })
        .session(session)
        .lean();

      if (exists) {
        await session.abortTransaction();
        return ResJson.invalid(res, "Amenity already exists");
      }

      const uploadResult = FileHelper.uploadFile(icon, {
        folder: "amenities",
        prefix: "icon",
      });

      if (!uploadResult.success) {
        await session.abortTransaction();
        return ResJson.invalid(res, uploadResult.error || "Failed to upload image");
      }

      const amenityId = await getNextSequence("amenityId", session);

      const amenity = await AmenityModel.create(
        [
          {
            amenityId,
            name,
            icon: uploadResult.filePath,
            createdBy: DBHelper.actor(req),
            updatedBy: DBHelper.actor(req),
          },
        ],
        { session }
      );

      await session.commitTransaction();

      ResJson.success(res, "Amenity created successfully", {
        amenity: AmenityControllerClass.getAmenity(amenity[0]),
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async getAllAmenities(req: AdminRequest, res: Response): Promise<void> {
    try {
      const result = await DBHelper.fetch({
        model: AmenityModel,
        req,
        searchFields: ["name.en", "name.ar", "amenityId"],
        projection: {
          amenityId: 1,
          _id: 1,
          name: {
            en: 1,
            ar: 1,
          },
          icon: DBHelper.file("$icon"),
          status: 1,
          createdAt: 1,
          createdBy: 1,
        },
      });
      return ResJson.success(res, "Amenities fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getAmenityDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetAmenityParams;

      const amenity = await AmenityModel.findOne({
        _id: id,
        deletedAt: null,
      }).lean();

      if (!amenity) {
        return ResJson.notFound(res, "Amenity not found");
      }

      return ResJson.success(res, "Amenity fetched", {
        amenity: AmenityControllerClass.getAmenity(amenity),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async updateAmenity(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TUpdateAmenityParams;
      const { name, icon } = req.body as TUpdateAmenityRequest;

      const amenity = await AmenityModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!amenity) {
        return ResJson.notFound(res, "Amenity not found");
      }

      const existingWithSameName = await AmenityModel.findOne({
        _id: { $ne: id },
        deletedAt: null,
        $or: [{ "name.ar": name.ar }, { "name.en": name.en }],
      });

      if (existingWithSameName) {
        return ResJson.invalid(res, "Amenity with this name already exists");
      }

      if (icon) {
        const uploadResult = FileHelper.uploadFile(icon, {
          folder: "amenities",
          prefix: "icon",
        });

        if (!uploadResult.success) {
          return ResJson.invalid(res, uploadResult.error || "Failed to upload image");
        }

        FileHelper.deleteFile(amenity.icon ?? "");

        amenity.icon = uploadResult.filePath;
      }

      amenity.name = name;
      amenity.updatedBy = DBHelper.actor(req);
      await amenity.save();

      return ResJson.success(res, "Amenity updated successfully", {
        amenity: AmenityControllerClass.getAmenity(amenity),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async deleteAmenity(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TDeleteAmenityParams;

      const amenity = await AmenityModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!amenity) {
        return ResJson.notFound(res, "Amenity not found");
      }

      amenity.deletedAt = new Date();
      amenity.deletedBy = DBHelper.actor(req);

      await amenity.save();

      return ResJson.success(res, "Amenity deleted successfully");
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async toggleStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TToggleStatusParams;

      const amenity = await AmenityModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!amenity) {
        return ResJson.notFound(res, "Amenity not found");
      }

      amenity.status = amenity.status === StatusEnum.active ? StatusEnum.inactive : StatusEnum.active;
      amenity.updatedAt = new Date();
      amenity.updatedBy = DBHelper.actor(req);

      await amenity.save();

      return ResJson.success(res, `Amenity ${amenity.status === StatusEnum.active ? "activated" : "deactivated"} successfully`, {
        amenity: AmenityControllerClass.getAmenity(amenity),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getAmenities(req: AdminRequest, res: Response): Promise<void> {
    try {
      const amenities = await AmenityModel.find({
        deletedAt: null,
      }).lean();

      if (!amenities) {
        return ResJson.notFound(res, "Amenity not found");
      }

      return ResJson.success(res, "Amenity fetched", {
        amenities,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const AmenityController = new AmenityControllerClass();
