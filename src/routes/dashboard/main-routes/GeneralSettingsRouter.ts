import express, { type Router } from "express";
import { GeneralSettingsController } from "@/controllers/dashboard/GeneralSettingsController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { GeneralSettingsValidation } from "../validations/GeneralSettingsValidation";

export const GeneralSettingsRouter: Router = express.Router();

GeneralSettingsRouter.get("/", GeneralSettingsController.getGeneralSettings);
GeneralSettingsRouter.patch("/", validateRequest(GeneralSettingsValidation.update), GeneralSettingsController.updateGeneralSettings);
