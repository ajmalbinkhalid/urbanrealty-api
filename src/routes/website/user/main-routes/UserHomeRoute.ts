import express, { type Router } from "express";
import { WebUserHomepageController } from "@/controllers/website/user/WebUserHomepageController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { WebUserHomeValidation } from "../validations/UserHomeValidation";

export const WebUserHomeRouter: Router = express.Router();

WebUserHomeRouter.get("/featured-agencies", WebUserHomepageController.getFeaturedAgencies);
WebUserHomeRouter.get("/agencies", WebUserHomepageController.getAllAgencies);
WebUserHomeRouter.get("/agency/:id", validateRequest(WebUserHomeValidation.getAgencyDetails), WebUserHomepageController.getAgencyDetails);
WebUserHomeRouter.get("/agency/:id/properties", validateRequest(WebUserHomeValidation.getPropertiesByAgency), WebUserHomepageController.getPropertiesByAgency);
WebUserHomeRouter.get("/featured-properties", WebUserHomepageController.getFeaturedProperties);
WebUserHomeRouter.get("/properties", WebUserHomepageController.getAllProperty);
WebUserHomeRouter.get("/property/:id", validateRequest(WebUserHomeValidation.getPropertyDetails), WebUserHomepageController.getPropertyDetails);
WebUserHomeRouter.get("/locations", WebUserHomepageController.getLocations);
WebUserHomeRouter.get("/sub-categories", WebUserHomepageController.getSubCategories);
WebUserHomeRouter.post("/recent-properties", AuthMiddleware.guestUser, validateRequest(WebUserHomeValidation.recentlyViewedProperties), WebUserHomepageController.recentlyViewedProperties);
