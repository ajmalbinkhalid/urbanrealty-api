import express, { type Router } from "express";
import { AdminAuthController } from "@/controllers/dashboard/AuthController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { OTPMiddleware } from "@/middleware/OtpMiddleware";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { AdminAuthValidation } from "../validations/AuthRouterValidation";

export const AdminAuthRouter: Router = express.Router();

AdminAuthRouter.post("/login", validateRequest(AdminAuthValidation.adminLogin), AdminAuthController.adminLogin);

AdminAuthRouter.post("/request-otp", validateRequest(AdminAuthValidation.adminRequestOtp), AdminAuthController.adminRequestOtp);

AdminAuthRouter.post("/verify-otp", validateRequest(AdminAuthValidation.adminVerifyOtp), OTPMiddleware.admin, AdminAuthController.adminVerifyOtp);

AdminAuthRouter.post("/resend-otp", validateRequest(AdminAuthValidation.adminResendOtp), OTPMiddleware.admin, AdminAuthController.adminResendOtp);

AdminAuthRouter.post("/reset-password", validateRequest(AdminAuthValidation.adminResetPassword), OTPMiddleware.admin, AdminAuthController.adminResetPassword);

AdminAuthRouter.use(AuthMiddleware.admin);

AdminAuthRouter.get("/profile", AdminAuthController.getAdminProfile);
AdminAuthRouter.get("/fcm-token", AdminAuthController.saveNotificationToken);
AdminAuthRouter.get("/logout", AdminAuthController.saveNotificationToken);
AdminAuthRouter.get("/validate", AdminAuthController.validateToken);
AdminAuthRouter.post("/update-name", validateRequest(AdminAuthValidation.updateAdminName), AdminAuthController.updateAdminName);
AdminAuthRouter.patch("/update-password", validateRequest(AdminAuthValidation.updatePassword), AdminAuthController.updatePassword);
// AdminAuthRouter.post("/create", validateRequest(AdminAuthValidation.adminRegister), AdminAuthController.adminRegister);
