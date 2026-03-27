import express, { type Router } from "express";
import { AppUserPackagesController } from "@/controllers/app/user/UserAppPackageController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { CustomPackageValidation } from "../validations/UserAppPackageRouterValidation";

export const AppUserPackageRouter: Router = express.Router();

AppUserPackageRouter.get("/", AppUserPackagesController.getAllPackages);
AppUserPackageRouter.post("/", validateRequest(CustomPackageValidation.createCustomPackageDetails), AppUserPackagesController.createCustomPackage);
