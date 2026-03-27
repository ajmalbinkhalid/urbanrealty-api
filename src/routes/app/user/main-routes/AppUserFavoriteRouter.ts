import express, { type Router } from "express";
import { UserAppFavoriteController } from "@/controllers/app/user/UserAppFavoriteController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { UserFavoriteValidation } from "../validations/UserFavoriteRouterValidation";

export const AppUserFavoriteRouter: Router = express.Router();

AppUserFavoriteRouter.post("/:id", validateRequest(UserFavoriteValidation.toggleFavorite), UserAppFavoriteController.toggleFavorite);
AppUserFavoriteRouter.get("/", UserAppFavoriteController.getUserFavorite);
AppUserFavoriteRouter.get("/properties", AuthMiddleware.user, UserAppFavoriteController.getFavoriteProperties);
