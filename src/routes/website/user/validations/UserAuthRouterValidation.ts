import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const WebUserAuthValidation = {
  register: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      email: ZodHelpers.email,
      phone: ZodHelpers.phone,
    }),
  }),

  requestOtp: z.object({
    body: z.object({
      email: ZodHelpers.email,
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

export type TWebUserRegisterRequest = z.infer<typeof WebUserAuthValidation.register>["body"];
export type TWebUserRequestOtpRequest = z.infer<typeof WebUserAuthValidation.requestOtp>["body"];
export type TWebUserVerifyOtpRequest = z.infer<typeof WebUserAuthValidation.verifyOtp>["body"];
export type TWebUserResendOtpRequest = z.infer<typeof WebUserAuthValidation.resendOtp>["body"];
export type TWebUserUpdateProfileRequest = z.infer<typeof WebUserAuthValidation.updateProfile>["body"];
