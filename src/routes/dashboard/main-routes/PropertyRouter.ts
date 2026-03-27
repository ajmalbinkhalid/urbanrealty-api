import express, { type Router } from "express";
import { PropertyController } from "@/controllers/dashboard/PropertyController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { PropertyValidation } from "../validations/PropertyRouterValidation";

export const PropertyRouter: Router = express.Router();

PropertyRouter.post("/", validateRequest(PropertyValidation.createProperty), PropertyController.createProperty);
PropertyRouter.get("/", PropertyController.getAllProperty);
PropertyRouter.get("/:id", validateRequest(PropertyValidation.getPropertyDetails), PropertyController.getPropertyDetails);
PropertyRouter.patch("/:id", validateRequest(PropertyValidation.updateProperty), PropertyController.updateProperty);
PropertyRouter.delete("/:id", validateRequest(PropertyValidation.deleteProperty), PropertyController.deleteProperty);
PropertyRouter.patch("/:id/status", validateRequest(PropertyValidation.togglePropertyStatus), PropertyController.togglePropertyStatus);
PropertyRouter.patch("/:id/verification-status", validateRequest(PropertyValidation.updateVerificationStatus), PropertyController.updatePropertyVerificationStatus);
PropertyRouter.patch("/:id/featured", validateRequest(PropertyValidation.togglePropertyFeaturedStatus), PropertyController.togglePropertyFeaturedStatus);
