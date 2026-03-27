import express, { type Router } from "express";
import { WebAgencyController } from "@/controllers/website/agency/WebAgencyController";
export const webAgencyPackageRouter: Router = express.Router();

webAgencyPackageRouter.get("/", WebAgencyController.getAllPackages);
