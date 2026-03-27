import express, { type Router } from "express";
import { WebAgencyPropertiesController } from "@/controllers/website/agency/WebAgencyPropertiesController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { WebAgencyPropertyValidation } from "../validations/AgencyPropertyRouterValidation";

export const WebAgencyPropertiesRouter: Router = express.Router();

WebAgencyPropertiesRouter.post("/create", validateRequest(WebAgencyPropertyValidation.createProperty), WebAgencyPropertiesController.createProperty);
WebAgencyPropertiesRouter.get("/", WebAgencyPropertiesController.getAgencyProperties);
WebAgencyPropertiesRouter.get("/:id", validateRequest(WebAgencyPropertyValidation.getPropertyDetails), WebAgencyPropertiesController.getAgencyPropertyDetails);
WebAgencyPropertiesRouter.patch("/:id", validateRequest(WebAgencyPropertyValidation.updateProperty), WebAgencyPropertiesController.updateProperty);
WebAgencyPropertiesRouter.delete("/:id", validateRequest(WebAgencyPropertyValidation.deleteProperty), WebAgencyPropertiesController.deleteProperty);
WebAgencyPropertiesRouter.patch("/:id/toggle-status", validateRequest(WebAgencyPropertyValidation.togglePropertyStatus), WebAgencyPropertiesController.togglePropertyStatus);
WebAgencyPropertiesRouter.patch("/:id/toggle-featured", validateRequest(WebAgencyPropertyValidation.togglePropertyFeaturedStatus), WebAgencyPropertiesController.togglePropertyFeaturedStatus);
