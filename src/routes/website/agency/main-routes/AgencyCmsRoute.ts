import express, { type Router } from "express";
import { cmsAgencyWebController } from "@/controllers/website/agency/CmsAgencyWebController";

export const WebAgencyCmsRoute: Router = express.Router();

WebAgencyCmsRoute.get("/privacy-policy", cmsAgencyWebController.getPrivacyPolicy);
WebAgencyCmsRoute.get("/terms-and-conditions", cmsAgencyWebController.getTermsAndConditions);
WebAgencyCmsRoute.get("/faq", cmsAgencyWebController.getFaq);
WebAgencyCmsRoute.get("/how-it-works", cmsAgencyWebController.getHowItWorks);
