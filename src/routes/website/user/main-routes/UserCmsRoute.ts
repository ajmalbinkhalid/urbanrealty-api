import express, { type Router } from "express";
import { cmsUserWebController } from "@/controllers/website/user/CmsUserWebController";

export const WebUserCmsRoute: Router = express.Router();

WebUserCmsRoute.get("/privacy-policy", cmsUserWebController.getPrivacyPolicy);
WebUserCmsRoute.get("/terms-and-conditions", cmsUserWebController.getTermsAndConditions);
WebUserCmsRoute.get("/faq", cmsUserWebController.getFaq);
WebUserCmsRoute.get("/how-it-works", cmsUserWebController.getHowItWorks);
