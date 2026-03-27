import express, { type Router } from "express";
import { AgencyAppController } from "@/controllers/app/agency/AgencyAppController";
export const AppAgencyPackageRouter: Router = express.Router();

AppAgencyPackageRouter.get("/", AgencyAppController.getAllPackages);
