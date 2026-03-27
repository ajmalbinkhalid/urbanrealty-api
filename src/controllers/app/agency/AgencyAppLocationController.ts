import type { Response } from "express";
import { LocationModel } from "@/database/models/LocationModel";
import { StatusEnum } from "@/enum/StatusEnum";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";

class LocationController {
  async getAllLocations(req: UserRequest, res: Response): Promise<void> {
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
}

export const LocationAgencyController = new LocationController();
