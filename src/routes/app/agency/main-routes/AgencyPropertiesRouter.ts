import express, { type Router } from "express";
import { AppAgencyPropertiesController } from "@/controllers/app/agency/AgencyPropertiesController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { AppAgencyPropertyValidation } from "../validations/AgencyPropertyRouterValidation";

export const AppAgencyPropertiesRouter: Router = express.Router();
AppAgencyPropertiesRouter.post("/create", validateRequest(AppAgencyPropertyValidation.createProperty), AppAgencyPropertiesController.createProperty);
AppAgencyPropertiesRouter.get("/", AppAgencyPropertiesController.getAgencyProperties);
AppAgencyPropertiesRouter.get("/:id", validateRequest(AppAgencyPropertyValidation.getPropertyDetails), AppAgencyPropertiesController.getAgencyPropertyDetails);
AppAgencyPropertiesRouter.get("/:id/edit-data", validateRequest(AppAgencyPropertyValidation.getPropertyDetails), AppAgencyPropertiesController.getDetailsForPropertyEdit);

AppAgencyPropertiesRouter.post("/:id", validateRequest(AppAgencyPropertyValidation.updateProperty), AppAgencyPropertiesController.updateProperty);
AppAgencyPropertiesRouter.delete("/:id", validateRequest(AppAgencyPropertyValidation.deleteProperty), AppAgencyPropertiesController.deleteProperty);
AppAgencyPropertiesRouter.patch("/:id/featured", validateRequest(AppAgencyPropertyValidation.togglePropertyFeaturedStatus), AppAgencyPropertiesController.togglePropertyFeaturedStatus);
AppAgencyPropertiesRouter.patch("/:id/toggle-status", validateRequest(AppAgencyPropertyValidation.togglePropertyStatus), AppAgencyPropertiesController.togglePropertyStatus);
