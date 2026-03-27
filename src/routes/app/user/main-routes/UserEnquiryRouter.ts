import express, { type Router } from "express";
import { UserAppController } from "@/controllers/app/user/UserAppController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { EnquiryValidation } from "@/routes/website/user/validations/EnquiryRouterValidation";

export const AppUserEnquiryRouter: Router = express.Router();
AppUserEnquiryRouter.post("/", validateRequest(EnquiryValidation.createEnquiry), UserAppController.createEnquiry);
