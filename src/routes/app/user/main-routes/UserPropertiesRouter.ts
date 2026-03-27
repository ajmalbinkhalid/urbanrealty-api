import express, { type Router } from "express";
import { AppUserPropertiesController } from "@/controllers/app/user/UserAppPropertiesController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { AppUserPropertyValidation } from "../validations/UserPropertyRouterValidation";

export const AppUserPropertiesRouter: Router = express.Router();

AppUserPropertiesRouter.post("/create", validateRequest(AppUserPropertyValidation.createProperty), AppUserPropertiesController.createProperty);
AppUserPropertiesRouter.get("/", AppUserPropertiesController.getAllProperty);
AppUserPropertiesRouter.get("/:id", validateRequest(AppUserPropertyValidation.getPropertyDetails), AppUserPropertiesController.getPropertyDetails);
AppUserPropertiesRouter.get("/:id/edit-data", validateRequest(AppUserPropertyValidation.getPropertyDetails), AppUserPropertiesController.getDetailsForPropertyEdit);
AppUserPropertiesRouter.post("/:id", validateRequest(AppUserPropertyValidation.updateProperty), AppUserPropertiesController.updateProperty);
AppUserPropertiesRouter.delete("/:id", validateRequest(AppUserPropertyValidation.deleteProperty), AppUserPropertiesController.deleteProperty);
AppUserPropertiesRouter.patch("/:id/featured", validateRequest(AppUserPropertyValidation.togglePropertyFeaturedStatus), AppUserPropertiesController.togglePropertyFeaturedStatus);
AppUserPropertiesRouter.patch("/:id/toggle-status", validateRequest(AppUserPropertyValidation.togglePropertyStatus), AppUserPropertiesController.togglePropertyStatus);
