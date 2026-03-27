import { z } from "zod";
import { ZodHelpers } from "@/utils/zod-helpers";

export const AdminAuthValidation = {
  adminLogin: z.object({
    body: z.object({
      email: ZodHelpers.email,
      password: z.string().min(5, "Password must be at least 5 characters").trim(),
    }),
  }),
  adminRegister: z.object({
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters").trim(),
      email: ZodHelpers.email,
      password: z.string().min(6, "Password must be at least 6 characters").trim(),
    }),
  }),

  adminRequestOtp: z.object({
    body: z.object({
      email: ZodHelpers.email,
    }),
  }),
  adminVerifyOtp: z.object({
    body: z.object({
      otp: z.string().min(4, "OTP must be at least 4 characters").trim(),
    }),
  }),
  adminResendOtp: z.object({
    body: z.object({}),
  }),
  adminResetPassword: z.object({
    body: z
      .object({
        newPassword: z.string().trim().min(6, "Password must be at least 6 characters"),

        confirmPassword: z.string().trim().min(6, "Password must be at least 6 characters"),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
      }),
  }),
  updatePassword: z.object({
    body: z.object({
      oldPassword: z.string().min(6, "Password must be at least 6 characters").trim(),
      newPassword: z.string().min(6, "Password must be at least 6 characters").trim(),
      confirmedPassword: z.string().min(6, "Password must be at least 6 characters").trim(),
    }),
  }),
  updateAdminName: z.object({
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
    }),
  }),
};

// Type exports for type-safe request handling
export type TAdminRegisterRequest = z.infer<typeof AdminAuthValidation.adminRegister>["body"];
export type TAdminLoginRequest = z.infer<typeof AdminAuthValidation.adminLogin>["body"];
export type TAdminRequestOtpRequest = z.infer<typeof AdminAuthValidation.adminRequestOtp>["body"];
export type TAdminVerifyOtpRequest = z.infer<typeof AdminAuthValidation.adminVerifyOtp>["body"];
export type TAdminResendOtpRequest = z.infer<typeof AdminAuthValidation.adminResendOtp>["body"];
export type TAdminResetPasswordRequest = z.infer<typeof AdminAuthValidation.adminResetPassword>["body"];
export type TUpdatePasswordRequest = z.infer<typeof AdminAuthValidation.updatePassword>["body"];
export type TUpdateAdminNameRequest = z.infer<typeof AdminAuthValidation.updateAdminName>["body"];
