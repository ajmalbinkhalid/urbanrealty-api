import { z } from "zod";
import { PlatformTypeEnum } from "@/enum/PlatformTypeEnum";
import { ZodHelpers } from "@/utils/zod-helpers";

export const AppAgencyAuthValidation = {
  register: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      email: ZodHelpers.email,
      phone: ZodHelpers.phone,
      company: z.string().min(2, "Company name must be at least 2 characters"),
      cRNumber: z.string().min(2, "CR Number must be at least 2 characters"),
    }),
  }),

  resubmitApplication: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      company: z.string().min(2, "Company name must be at least 2 characters"),
      cRNumber: z.string().min(2, "CR Number must be at least 2 characters"),
      phone: ZodHelpers.phone,
    }),
  }),

  saveNotification: z.object({
    body: z.object({
      token: z.string().min(1, "Token is required"),
      platform: ZodHelpers.enum({
        enumObj: PlatformTypeEnum,
        name: "Platform",
      }),
    }),
  }),

  deleteNotification: z.object({
    body: z.object({
      token: z.string().min(1, "Token is required"),
    }),
  }),
  requestOtp: z.object({
    body: z.object({
      email: ZodHelpers.email,
      // phone: ZodHelpers.phone.optional(),
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
      companyName: z.string().min(2, "Company name must be at least 2 characters long"),

      cRNumber: z.string().min(2, "CR number must be at least 2 characters long"),

      companyEmail: z.string().email("Please enter a valid company email address"),

      firstName: z.string().min(1, "First name is required"),

      lastName: z.string().min(1, "Last name is required"),

      companyLogo: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),

      companyWhatsapp: ZodHelpers.phone.optional(),

      companyPhone: ZodHelpers.phone,

      about: z
        .object({
          en: z.string().optional(),
          ar: z.string().optional(),
        })
        .optional(),
    }),
  }),
};

// Type exports for type-safe request handling
export type TAppAgencyRegisterRequest = z.infer<typeof AppAgencyAuthValidation.register>["body"];
export type TAppAgencyRequestOtpRequest = z.infer<typeof AppAgencyAuthValidation.requestOtp>["body"];
export type TAppAgencyVerifyOtpRequest = z.infer<typeof AppAgencyAuthValidation.verifyOtp>["body"];
export type TAppAgencyResendOtpRequest = z.infer<typeof AppAgencyAuthValidation.resendOtp>["body"];
export type TAppAgencyUpdateProfileRequest = z.infer<typeof AppAgencyAuthValidation.updateProfile>["body"];
export type TAppAgencySaveNotificationRequest = z.infer<typeof AppAgencyAuthValidation.saveNotification>["body"];
export type TAppAgencyDeleteNotificationRequest = z.infer<typeof AppAgencyAuthValidation.deleteNotification>["body"];
export type TWebAgencyResubmitApplicationRequest = z.infer<typeof AppAgencyAuthValidation.resubmitApplication>["body"];
