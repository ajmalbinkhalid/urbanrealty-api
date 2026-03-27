import EnquiryController from "@controllers/dashboard/EnquiryController";
import express, { type Router } from "express";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { EnquiryValidation } from "../validations/EnquiryRouterValidation";

export const EnquiryRouter: Router = express.Router();

EnquiryRouter.get("/", validateRequest(EnquiryValidation.getAllEnquiries), EnquiryController.getAllEnquiries);
EnquiryRouter.get("/:id", validateRequest(EnquiryValidation.getEnquiryDetails), EnquiryController.getEnquiryDetails);
EnquiryRouter.delete("/:id", validateRequest(EnquiryValidation.deleteEnquiry), EnquiryController.deleteEnquiry);
