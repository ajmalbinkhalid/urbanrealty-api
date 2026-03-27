import express, { type Router } from "express";
import { AmenityController } from "@/controllers/dashboard/AmenityController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { AmenityValidation } from "../validations/AmenityRouterValidation";

export const AmenityRouter: Router = express.Router();

AmenityRouter.get("/", validateRequest(AmenityValidation.getAllAmenities), AmenityController.getAllAmenities);
AmenityRouter.get("/all", AmenityController.getAmenities);
AmenityRouter.post("/", validateRequest(AmenityValidation.createAmenity), AmenityController.createAmenity);
AmenityRouter.get("/:id", validateRequest(AmenityValidation.getAmenityDetails), AmenityController.getAmenityDetails);
AmenityRouter.put("/:id", validateRequest(AmenityValidation.updateAmenity), AmenityController.updateAmenity);
AmenityRouter.delete("/:id", validateRequest(AmenityValidation.deleteAmenity), AmenityController.deleteAmenity);
AmenityRouter.patch("/:id/status", validateRequest(AmenityValidation.toggleStatus), AmenityController.toggleStatus);
