import express, { type Router } from "express";
import { WebUserPropertiesController } from "@/controllers/website/user/WebUserPropertiesController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { WebUserPropertyValidation } from "../validations/UserPropertyRouterValidation";

export const WebUserPropertiesRouter: Router = express.Router();
WebUserPropertiesRouter.post("/create", validateRequest(WebUserPropertyValidation.createProperty), WebUserPropertiesController.createProperty);
WebUserPropertiesRouter.get("/", WebUserPropertiesController.getUserProperties);
WebUserPropertiesRouter.get("/:id", validateRequest(WebUserPropertyValidation.getPropertyDetails), WebUserPropertiesController.getUserPropertyDetails);
WebUserPropertiesRouter.patch("/:id", validateRequest(WebUserPropertyValidation.updateProperty), WebUserPropertiesController.updateProperty);
WebUserPropertiesRouter.delete("/:id", validateRequest(WebUserPropertyValidation.deleteProperty), WebUserPropertiesController.deleteProperty);
WebUserPropertiesRouter.patch("/:id/toggle-status", validateRequest(WebUserPropertyValidation.togglePropertyStatus), WebUserPropertiesController.togglePropertyStatus);
WebUserPropertiesRouter.patch("/:id/toggle-featured", validateRequest(WebUserPropertyValidation.togglePropertyFeaturedStatus), WebUserPropertiesController.togglePropertyFeaturedStatus);
