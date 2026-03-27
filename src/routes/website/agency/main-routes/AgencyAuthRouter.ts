import { WebAgencyAuthController } from "@controllers/website/agency/AgencyAuthControllers";
import { AuthMiddleware } from "@middleware/AuthMiddleware";
import { validateRequest } from "@middleware/ValidationMiddleware";
import express, { type Router } from "express";
import { OTPMiddleware } from "@/middleware/OtpMiddleware";
import { WebAgencyAuthValidation } from "../validations/AgencyAuthRouterValidation";

export const WebAgencyAuthRouter: Router = express.Router();

WebAgencyAuthRouter.post("/register", validateRequest(WebAgencyAuthValidation.register), WebAgencyAuthController.agencyRegister);

WebAgencyAuthRouter.post("/request-otp", validateRequest(WebAgencyAuthValidation.requestOtp), WebAgencyAuthController.agencyRequestOtp);

WebAgencyAuthRouter.post("/verify-otp", OTPMiddleware.agency, validateRequest(WebAgencyAuthValidation.verifyOtp), WebAgencyAuthController.agencyVerifyOtp);

WebAgencyAuthRouter.post("/resend-otp", OTPMiddleware.agency, validateRequest(WebAgencyAuthValidation.resendOtp), WebAgencyAuthController.agencyResendOtp);

WebAgencyAuthRouter.use(AuthMiddleware.agency);

WebAgencyAuthRouter.get("/get-profile", WebAgencyAuthController.getAgencyProfile);

WebAgencyAuthRouter.put("/update-profile", validateRequest(WebAgencyAuthValidation.updateProfile), WebAgencyAuthController.updateAgencyProfile);
