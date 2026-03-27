import express, { type Router } from "express";
import { PackageController } from "@/controllers/dashboard/PackageController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { PackageValidation } from "../validations/PackageRouteValidation";

export const PackageRouter: Router = express.Router();

PackageRouter.get("/", PackageController.getAllPackages);
PackageRouter.post("/", validateRequest(PackageValidation.createPackage), PackageController.createPackage);
PackageRouter.get("/:id", validateRequest(PackageValidation.getPackageDetails), PackageController.getPackageDetails);
PackageRouter.put("/:id", validateRequest(PackageValidation.updatePackage), PackageController.updatePackage);
PackageRouter.delete("/:id", validateRequest(PackageValidation.deletePackage), PackageController.deletePackage);
PackageRouter.patch("/:id", validateRequest(PackageValidation.toggleStatus), PackageController.toggleStatus);
