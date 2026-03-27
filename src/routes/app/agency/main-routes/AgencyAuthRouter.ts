import { AppAgencyAuthController } from "@controllers/app/agency/AgencyAuthControllers";
import { AuthMiddleware } from "@middleware/AuthMiddleware";
import { OTPMiddleware } from "@middleware/OtpMiddleware";
import { validateRequest } from "@middleware/ValidationMiddleware";
import express, { type Router } from "express";
import { AppAgencyAuthValidation } from "../validations/AgencyAuthRouterValidation";

export const AppAgencyAuthRouter: Router = express.Router();

AppAgencyAuthRouter.post("/register", validateRequest(AppAgencyAuthValidation.register), AppAgencyAuthController.agencyRegister);

AppAgencyAuthRouter.post("/request-otp", validateRequest(AppAgencyAuthValidation.requestOtp), AppAgencyAuthController.agencyRequestOtp);

AppAgencyAuthRouter.post("/verify-otp", OTPMiddleware.agency, validateRequest(AppAgencyAuthValidation.verifyOtp), AppAgencyAuthController.agencyVerifyOtp);

AppAgencyAuthRouter.post("/resend-otp", OTPMiddleware.agency, validateRequest(AppAgencyAuthValidation.resendOtp), AppAgencyAuthController.agencyResendOtp);

AppAgencyAuthRouter.use(AuthMiddleware.agency);

AppAgencyAuthRouter.get("/get-profile", AppAgencyAuthController.getAgencyProfile);

AppAgencyAuthRouter.put("/update-profile", validateRequest(AppAgencyAuthValidation.updateProfile), AppAgencyAuthController.updateAgencyProfile);
AppAgencyAuthRouter.post("/fcm-token", validateRequest(AppAgencyAuthValidation.saveNotification), AppAgencyAuthController.saveNotificationToken);
AppAgencyAuthRouter.delete("/fcm-logout", validateRequest(AppAgencyAuthValidation.deleteNotification), AppAgencyAuthController.deleteNotificationToken);
