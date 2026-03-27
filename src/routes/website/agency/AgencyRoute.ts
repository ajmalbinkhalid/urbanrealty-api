import express, { type Router } from "express";
import { WebAgencyController } from "@/controllers/website/agency/WebAgencyController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { WebAgencyAuthRouter } from "./main-routes/AgencyAuthRouter";
import { WebAgencyCmsRoute } from "./main-routes/AgencyCmsRoute";
import { webAgencyPackageRouter } from "./main-routes/AgencyPackageRoute";
import { WebAgencyPropertiesRouter } from "./main-routes/AgencyPropertiesRouter";
import { WebAgencyAuthValidation } from "./validations/AgencyAuthRouterValidation";

export const WebAgencyRouter: Router = express.Router();

WebAgencyRouter.use("/auth", WebAgencyAuthRouter);

WebAgencyRouter.use(AuthMiddleware.agency);

WebAgencyRouter.post("/resubmit-application", validateRequest(WebAgencyAuthValidation.resubmitApplication), WebAgencyController.resubmitApplication);

WebAgencyRouter.get("/locations", WebAgencyController.getLocations);
WebAgencyRouter.get("/amenities", WebAgencyController.getAmenities);
WebAgencyRouter.get("/sub-categories", WebAgencyController.getSubCategories);

WebAgencyRouter.use("/properties", WebAgencyPropertiesRouter);
WebAgencyRouter.use("/packages", webAgencyPackageRouter);
WebAgencyRouter.use("/cms", WebAgencyCmsRoute);
