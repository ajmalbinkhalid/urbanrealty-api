import type { Response } from "express";
import mongoose from "mongoose";
import { FavoriteModel } from "@/database/models/FavoriteModel";
import { PropertyModel } from "@/database/models/PropertyModel";
import type { TToggleFavoriteParams } from "@/routes/app/user/validations/UserFavoriteRouterValidation";
import type { UserRequest } from "@/types/user-type";
import { DBHelper } from "@/utils/db-helpers";
import { ResJson } from "@/utils/response-json";

class UserAppFavoriteControllerClass {
  async toggleFavorite(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const { id } = req.params as TToggleFavoriteParams;

      const propertyExists = await PropertyModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
        deletedAt: null,
      });

      if (!propertyExists) {
        return ResJson.notFound(res, "Property not found");
      }

      const existingFavorite = await FavoriteModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        propertyId: new mongoose.Types.ObjectId(id),
      });

      if (existingFavorite) {
        await existingFavorite.deleteOne();

        return ResJson.success(res, "Removed from favorites", {
          isFavorite: false,
        });
      }

      await FavoriteModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        propertyId: new mongoose.Types.ObjectId(id),
      });

      return ResJson.success(res, "Added to favorites", {
        isFavorite: true,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
  async getUserFavorite(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;

      const filters: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
      };

      const result = await DBHelper.fetch({
        model: FavoriteModel,
        req,
        filters,

        sortBy: { createdAt: -1 },

        projection: {
          _id: 1,
          propertyId: 1,
          createdAt: 1,
        },
      });
      return ResJson.success(res, "Favorite fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}
export const UserAppFavoriteController = new UserAppFavoriteControllerClass();
