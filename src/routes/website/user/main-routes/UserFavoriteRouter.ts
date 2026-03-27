import express, { type Router } from "express";
import { WebUserFavoriteController } from "@/controllers/website/user/WebUserFavoriteController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { UserFavoriteValidation } from "../validations/UserFavoriteRouterValidation";

export const WebUserFavoriteRouter: Router = express.Router();

WebUserFavoriteRouter.post("/:id", validateRequest(UserFavoriteValidation.toggleFavorite), WebUserFavoriteController.toggleFavorite);
WebUserFavoriteRouter.get("/", WebUserFavoriteController.getUserFavorite);
WebUserFavoriteRouter.get("/properties", AuthMiddleware.user, WebUserFavoriteController.getFavoriteProperties);
