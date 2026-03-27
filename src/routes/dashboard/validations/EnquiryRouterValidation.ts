import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const EnquiryValidation = {
  getAllEnquiries: z.object({
    query: z.object({}).optional(),
  }),

  getEnquiryDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),

  deleteEnquiry: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
};

export type TGetEnquiryParams = z.infer<typeof EnquiryValidation.getEnquiryDetails>["params"];

export type TDeleteEnquiryParams = z.infer<typeof EnquiryValidation.deleteEnquiry>["params"];
