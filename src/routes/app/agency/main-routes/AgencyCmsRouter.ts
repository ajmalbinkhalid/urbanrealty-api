import express, { type Router } from "express";
import { AppAgencyCmsController } from "@/controllers/app/agency/AgencyAppCmsController";

export const AppAgencyCmsRouter: Router = express.Router();

AppAgencyCmsRouter.get("/privacy-policy", AppAgencyCmsController.getPrivacyPolicy);
AppAgencyCmsRouter.get("/terms-and-conditions", AppAgencyCmsController.getTermsAndConditions);
AppAgencyCmsRouter.get("/faq", AppAgencyCmsController.getFaq);
AppAgencyCmsRouter.get("/how-it-works", AppAgencyCmsController.getHowItWorks);
