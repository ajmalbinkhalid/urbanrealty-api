import z from "zod";
import { ZodHelpers } from "@/utils/zod-helpers";

export const AppUserHomeValidation = {
  getPropertyDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  getPropertiesByAgency: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
};

export type TGetHomePropertyParams = z.infer<typeof AppUserHomeValidation.getPropertyDetails>["params"];
export type TGetPropertiesByAgencyParams = z.infer<typeof AppUserHomeValidation.getPropertiesByAgency>["params"];
