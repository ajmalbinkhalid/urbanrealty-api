import { validateRequest } from "@middleware/ValidationMiddleware";
import express, { type Router } from "express";
import { WebUserAuthController } from "@/controllers/website/user/UserAuthControllers";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { OTPMiddleware } from "@/middleware/OtpMiddleware";
import { WebUserAuthValidation } from "../validations/UserAuthRouterValidation";

export const WebUserAuthRouter: Router = express.Router();

WebUserAuthRouter.post("/register", validateRequest(WebUserAuthValidation.register), WebUserAuthController.userRegister);

WebUserAuthRouter.post("/request-otp", validateRequest(WebUserAuthValidation.requestOtp), WebUserAuthController.userRequestOtp);

WebUserAuthRouter.post("/verify-otp", OTPMiddleware.user, validateRequest(WebUserAuthValidation.verifyOtp), WebUserAuthController.userVerifyOtp);

WebUserAuthRouter.post("/resend-otp", OTPMiddleware.user, validateRequest(WebUserAuthValidation.resendOtp), WebUserAuthController.userResendOtp);

WebUserAuthRouter.use(AuthMiddleware.user);

WebUserAuthRouter.get("/get-profile", WebUserAuthController.getUserProfile);

WebUserAuthRouter.put("/update-profile", validateRequest(WebUserAuthValidation.updateProfile), WebUserAuthController.updateProfile);
