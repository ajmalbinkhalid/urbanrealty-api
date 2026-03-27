import express, { type Router } from "express";
import { AppUserCmsController } from "@/controllers/app/user/UserAppCmsController";

export const AppUserCmsRoute: Router = express.Router();

AppUserCmsRoute.get("/privacy-policy", AppUserCmsController.getPrivacyPolicy);
AppUserCmsRoute.get("/terms-and-conditions", AppUserCmsController.getTermsAndConditions);
AppUserCmsRoute.get("/faq", AppUserCmsController.getFaq);
AppUserCmsRoute.get("/how-it-works", AppUserCmsController.getHowItWorks);
