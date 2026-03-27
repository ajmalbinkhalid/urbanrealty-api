import express, { type Router } from "express";
import { CmsController } from "@/controllers/dashboard/CmsController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { CmsRouterValidation } from "../validations/CmsRouterValidation";

export const CmsRoute: Router = express.Router();
CmsRoute.get("/", CmsController.getAllCmsData);
CmsRoute.put("/", validateRequest(CmsRouterValidation.updateCms), CmsController.updateCms);
