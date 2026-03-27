import express, { type Router } from "express";
import { AgencyAppController } from "@/controllers/app/agency/AgencyAppController";
import { LocationAgencyController } from "@/controllers/app/agency/AgencyAppLocationController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { AppAgencyAuthRouter } from "./main-routes/AgencyAuthRouter";
import { AppAgencyCmsRouter } from "./main-routes/AgencyCmsRouter";
import { AppAgencyPackageRouter } from "./main-routes/AgencyPackageRoute";
import { AppAgencyPropertiesRouter } from "./main-routes/AgencyPropertiesRouter";
import { AppAgencyAuthValidation } from "./validations/AgencyAuthRouterValidation";

export const AppAgencyRouter: Router = express.Router();

AppAgencyRouter.use("/auth", AppAgencyAuthRouter);

AppAgencyRouter.use(AuthMiddleware.agency);

AppAgencyRouter.post("/resubmit-application", validateRequest(AppAgencyAuthValidation.resubmitApplication), AgencyAppController.resubmitApplication);

AppAgencyRouter.get("/locations", AgencyAppController.getLocations);
AppAgencyRouter.get("/all-locations", LocationAgencyController.getAllLocations);

AppAgencyRouter.get("/amenities", AgencyAppController.getAmenities);
AppAgencyRouter.get("/subcategory", AgencyAppController.getSubCategories);
AppAgencyRouter.get("/featured", AgencyAppController.getFeaturedProperties);

AppAgencyRouter.use("/properties", AppAgencyPropertiesRouter);
AppAgencyRouter.use("/packages", AppAgencyPackageRouter);
AppAgencyRouter.use("/cms", AppAgencyCmsRouter);
