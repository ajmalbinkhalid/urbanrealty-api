import { AgencyController } from "@controllers/dashboard/AgencyController";
import express, { type Router } from "express";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { AgencyValidation } from "../validations/AgencyRouterValidations";

export const AgencyRouter: Router = express.Router();

AgencyRouter.get("/", validateRequest(AgencyValidation.getAllAgencies), AgencyController.getAllAgencies);
AgencyRouter.post("/", validateRequest(AgencyValidation.createAgency), AgencyController.createAgency);
AgencyRouter.get("/:id", validateRequest(AgencyValidation.getAgencyDetails), AgencyController.getAgencyDetails);
AgencyRouter.put("/:id", validateRequest(AgencyValidation.updateAgency), AgencyController.updateAgency);
AgencyRouter.patch("/:id/status", validateRequest(AgencyValidation.toggleStatus), AgencyController.toggleStatus);
AgencyRouter.patch("/:id/featured", validateRequest(AgencyValidation.toggleFeatured), AgencyController.toggleFeatured);
AgencyRouter.patch("/:id/verification-status", validateRequest(AgencyValidation.updateVerificationStatus), AgencyController.updateVerificationStatus);
AgencyRouter.delete("/:id", validateRequest(AgencyValidation.deleteAgency), AgencyController.deleteAgency);
