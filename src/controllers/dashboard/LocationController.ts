import { LocationModel, type TLocationModel } from "@database/models/LocationModel";
import { ResJson } from "@utils/response-json";
import type { Response } from "express";
import { getNextSequence } from "@/database/models/CounterModel";
import { StatusEnum } from "@/enum/StatusEnum";
import type { TCreateLocationRequest, TDeleteLocationParams, TGetLocationParams, TToggleStatusParams, TUpdateLocationParams, TUpdateLocationRequest } from "@/routes/dashboard/validations/LocationRouterValidation";
import type { AdminRequest } from "@/types/admin-type";
import { DBHelper } from "@/utils/db-helpers";

class LocationControllerClass {
  static getLocation(location: TLocationModel): Record<string, unknown> {
    return {
      _id: location._id,
      locationId: location.locationId,
      city: {
        en: location.city.en,
        ar: location.city.ar,
      },
      status: location.status,
      createdAt: location.createdAt,
      createdBy: location.createdBy,
    };
  }

  async getAllLocations(req: AdminRequest, res: Response): Promise<void> {
    try {
      const result = await DBHelper.fetch({
        model: LocationModel,
        req,
        searchFields: ["city.en", "city.ar", "locationId"],
        projection: {
          locationId: 1,
          _id: 1,
          city: {
            en: 1,
            ar: 1,
          },
          status: 1,
          createdAt: 1,
          createdBy: 1,
        },
      });

      return ResJson.success(res, "Locations fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getLocationDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetLocationParams;

      const location = await LocationModel.findOne({
        _id: id,
        deletedAt: null,
      }).lean();

      if (!location) {
        return ResJson.notFound(res, "Location not found");
      }

      return ResJson.success(res, "Location fetched successfully", {
        location: LocationControllerClass.getLocation(location),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async createLocation(req: AdminRequest, res: Response): Promise<void> {
    const session = await LocationModel.startSession();
    session.startTransaction();
    try {
      const { city } = req.body as TCreateLocationRequest;

      // Check for existing location
      const existingLocation = await LocationModel.findOne({
        $or: [{ "city.ar": city.ar }, { "city.en": city.en }],
        deletedAt: null,
      })
        .session(session)
        .lean();

      if (existingLocation) {
        await session.abortTransaction();
        return ResJson.invalid(res, "Location already exists");
      }

      const locationId = await getNextSequence("locationId", session);

      const location = await LocationModel.create(
        [
          {
            city,
            locationId,
            createdBy: DBHelper.actor(req),
            updatedBy: DBHelper.actor(req),
          },
        ],
        { session }
      );
      await session.commitTransaction();

      ResJson.success(res, "Location created successfully", {
        location: LocationControllerClass.getLocation(location[0]),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async updateLocation(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TUpdateLocationParams;
      const { city } = req.body as TUpdateLocationRequest;

      const location = await LocationModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!location) {
        return ResJson.notFound(res, "Location not found");
      }

      const existingWithSameName = await LocationModel.findOne({
        _id: { $ne: id },
        deletedAt: null,
        $or: [{ "city.ar": city.ar }, { "city.en": city.en }],
      });

      if (existingWithSameName) {
        return ResJson.invalid(res, "Location with this name already exists");
      }

      location.city = city;
      location.updatedBy = DBHelper.actor(req);
      location.updatedAt = new Date();

      await location.save();

      return ResJson.success(res, "Location updated successfully", {
        location: LocationControllerClass.getLocation(location),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async deleteLocation(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TDeleteLocationParams;

      const location = await LocationModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!location) {
        return ResJson.notFound(res, "Location not found");
      }

      location.deletedAt = new Date();
      location.deletedBy = DBHelper.actor(req);

      await location.save();

      return ResJson.success(res, "Location deleted successfully");
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async toggleStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TToggleStatusParams;

      const location = await LocationModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!location) {
        return ResJson.notFound(res, "Location not found");
      }

      location.status = location.status === StatusEnum.active ? StatusEnum.inactive : StatusEnum.active;
      location.updatedAt = new Date();
      location.updatedBy = DBHelper.actor(req);

      await location.save();

      return ResJson.success(res, `Location ${location.status === StatusEnum.active ? "activated" : "deactivated"} successfully`, {
        location: LocationControllerClass.getLocation(location),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getLocationsDropdown(_req: AdminRequest, res: Response): Promise<void> {
    try {
      const locations = await LocationModel.find({
        deletedAt: null,
      }).lean();

      if (!locations) {
        return ResJson.notFound(res, "locations not found");
      }

      return ResJson.success(res, "locations fetched", {
        locations,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const LocationController = new LocationControllerClass();
