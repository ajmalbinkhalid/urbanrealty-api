import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const EnquiryValidation = {
  createEnquiry: z.object({
    body: z
      .object({
        name: z.string().min(1, "Name is required"),

        email: ZodHelpers.email,

        phone: ZodHelpers.phone,

        message: z.string().min(1, "Message is required"),

        userId: ZodHelpers.mongoId.optional(),
      })
      .strict(),
  }),
};

export type TCreateEnquiryRequest = z.infer<typeof EnquiryValidation.createEnquiry>["body"];
