import express, { type Router } from "express";
import { UserAppAgencyController } from "@/controllers/app/user/UserAppAgency";

export const AppUserAgencyRouter: Router = express.Router();

AppUserAgencyRouter.get("/", UserAppAgencyController.getAllAgencies);
AppUserAgencyRouter.get("/featured", UserAppAgencyController.getFeaturedAgencies);
AppUserAgencyRouter.get("/:id", UserAppAgencyController.getOneAgency);
