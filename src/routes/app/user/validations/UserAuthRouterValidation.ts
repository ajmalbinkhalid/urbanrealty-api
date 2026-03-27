import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";
import { PlatformTypeEnum } from "@/enum/PlatformTypeEnum";

export const AppUserAuthValidation = {
  register: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      email: ZodHelpers.email,
      phone: ZodHelpers.phone,
    }),
  }),

  saveNotification: z.object({
    body: z.object({
      token: z.string().min(1, "Token is required"),
      platform: ZodHelpers.enum({
        enumObj: PlatformTypeEnum,
        name: "Platform",
      }).optional,
    }),
  }),

  deleteNotification: z.object({
    body: z.object({
      token: z.string().min(1, "Token is required"),
    }),
  }),
  requestOtp: z.object({
    body: z
      .object({
        email: ZodHelpers.email.optional(),
        phone: ZodHelpers.phone.optional(),
      })
      .refine((data) => data.email || data.phone, {
        message: "Either email or phone must be provided",
        path: ["email", "phone"],
      }),
  }),

  verifyOtp: z.object({
    body: z.object({
      otp: z.string().min(4, "OTP must be at least 4 characters"),
    }),
  }),

  resendOtp: z.object({
    body: z.object({}),
  }),

  updateProfile: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
      lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
      logo: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),
    }),
  }),
};

export type TAppUserRegisterRequest = z.infer<typeof AppUserAuthValidation.register>["body"];
export type TAppUserRequestOtpRequest = z.infer<typeof AppUserAuthValidation.requestOtp>["body"];
export type TAppUserVerifyOtpRequest = z.infer<typeof AppUserAuthValidation.verifyOtp>["body"];
export type TAppUserResendOtpRequest = z.infer<typeof AppUserAuthValidation.resendOtp>["body"];
export type TAppUserUpdateProfileRequest = z.infer<typeof AppUserAuthValidation.updateProfile>["body"];
export type TAppUserSaveNotificationRequest = z.infer<typeof AppUserAuthValidation.saveNotification>["body"];
export type TAppUserDeleteNotificationRequest = z.infer<typeof AppUserAuthValidation.deleteNotification>["body"];
