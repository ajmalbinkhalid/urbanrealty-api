import express, { type Router } from "express";
import { UserWebAgencyController } from "@/controllers/website/user/UserWebAgency";

export const WebUserAgencyRouter: Router = express.Router();

WebUserAgencyRouter.get("/", UserWebAgencyController.getAllAgencies);
WebUserAgencyRouter.get("/featured", UserWebAgencyController.getFeaturedAgencies);
WebUserAgencyRouter.get("/:id", UserWebAgencyController.getOneAgency);
