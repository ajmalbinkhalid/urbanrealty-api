import { AppUserAuthController } from "@controllers/app/user/UserAuthControllers";
import { validateRequest } from "@middleware/ValidationMiddleware";
import express, { type Router } from "express";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { OTPMiddleware } from "@/middleware/OtpMiddleware";
import { AppUserAuthValidation } from "../validations/UserAuthRouterValidation";

export const AppUserAuthRouter: Router = express.Router();

AppUserAuthRouter.post("/register", validateRequest(AppUserAuthValidation.register), AppUserAuthController.userRegister);

AppUserAuthRouter.post("/request-otp", validateRequest(AppUserAuthValidation.requestOtp), AppUserAuthController.userRequestOtp);

AppUserAuthRouter.post("/verify-otp", OTPMiddleware.user, validateRequest(AppUserAuthValidation.verifyOtp), AppUserAuthController.userVerifyOtp);

AppUserAuthRouter.post("/resend-otp", OTPMiddleware.user, validateRequest(AppUserAuthValidation.resendOtp), AppUserAuthController.userResendOtp);

AppUserAuthRouter.use(AuthMiddleware.user);

AppUserAuthRouter.get("/get-profile", AppUserAuthController.getUserProfile);

AppUserAuthRouter.put("/update-profile", validateRequest(AppUserAuthValidation.updateProfile), AppUserAuthController.updateProfile);
AppUserAuthRouter.post("/fcm-token", AppUserAuthController.saveNotificationToken);
AppUserAuthRouter.delete("/logout", AppUserAuthController.deleteNotificationToken);
