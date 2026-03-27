import express, { type Router } from "express";
import { UserAppHomepageController } from "@/controllers/app/user/UserAppHomepageController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { AppUserHomeValidation } from "../validations/UserHomeValidation";

export const AppUserHomeRouter: Router = express.Router();

AppUserHomeRouter.get("/locations", UserAppHomepageController.getLocations);
AppUserHomeRouter.get("/sub-categories", UserAppHomepageController.getSubCategories);
AppUserHomeRouter.get("/properties", UserAppHomepageController.getAllProperty);
AppUserHomeRouter.get("/properties/:id", validateRequest(AppUserHomeValidation.getPropertyDetails), UserAppHomepageController.getPropertyDetails);
AppUserHomeRouter.get("/agency/:id/properties", validateRequest(AppUserHomeValidation.getPropertiesByAgency), UserAppHomepageController.getPropertiesByAgency);
