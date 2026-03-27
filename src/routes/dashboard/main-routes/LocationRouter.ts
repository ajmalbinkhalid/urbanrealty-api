import express, { type Router } from "express";
import { LocationController } from "@/controllers/dashboard/LocationController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { LocationValidation } from "../validations/LocationRouterValidation";

export const LocationRouter: Router = express.Router();

LocationRouter.get("/", validateRequest(LocationValidation.getAllLocations), LocationController.getAllLocations);
LocationRouter.get("/all", validateRequest(LocationValidation.getAllLocations), LocationController.getLocationsDropdown);
LocationRouter.post("/", validateRequest(LocationValidation.createLocation), LocationController.createLocation);
LocationRouter.get("/:id", validateRequest(LocationValidation.getLocationDetails), LocationController.getLocationDetails);
LocationRouter.put("/:id", validateRequest(LocationValidation.updateLocation), LocationController.updateLocation);
LocationRouter.delete("/:id", validateRequest(LocationValidation.deleteLocation), LocationController.deleteLocation);
LocationRouter.patch("/:id/status", validateRequest(LocationValidation.toggleStatus), LocationController.toggleStatus);
