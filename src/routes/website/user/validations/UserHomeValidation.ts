import z from "zod";
import { ZodHelpers } from "@/utils/zod-helpers";

export const WebUserHomeValidation = {
  getPropertyDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  getAgencyDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  getPropertiesByAgency: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  recentlyViewedProperties: z.object({
    body: z.object({
      propertyIds: z.array(ZodHelpers.mongoId),
    }),
  }),
};

export type TGetPropertiesByAgencyParams = z.infer<typeof WebUserHomeValidation.getPropertiesByAgency>["params"];
export type TGetHomePropertyParams = z.infer<typeof WebUserHomeValidation.getPropertyDetails>["params"];
export type TGetHomeAgencyParams = z.infer<typeof WebUserHomeValidation.getAgencyDetails>["params"];
export type TRecentlyViewedPropertiesBody = z.infer<typeof WebUserHomeValidation.recentlyViewedProperties>["body"];
