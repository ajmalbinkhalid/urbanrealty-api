import express, { type Router } from "express";
import { WebUserController } from "@/controllers/website/user/WebUserController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { EnquiryValidation } from "../validations/EnquiryRouterValidation";

export const WebUserEnquiryRouter: Router = express.Router();

WebUserEnquiryRouter.post("/", validateRequest(EnquiryValidation.createEnquiry), WebUserController.createEnquiry);
