import { z } from "zod";
import {
  CommercialPropertyCreateSchema,
  CommercialPropertyUpdateSchema,
  LandPropertyCreateSchema,
  LandPropertyUpdateSchema,
  PropertyParamsSchema,
  PropertyVerificationStatusUpdateSchema,
  ResidentialPropertyCreateSchema,
  ResidentialPropertyUpdateSchema,
} from "@/routes/validations/property-base-schemas";

export const PropertyValidation = {
  createProperty: z.object({
    body: z.discriminatedUnion("propertyCategoryId", [ResidentialPropertyCreateSchema, CommercialPropertyCreateSchema, LandPropertyCreateSchema]),
  }),

  updateProperty: z.object({
    params: PropertyParamsSchema,
    body: z.discriminatedUnion("propertyCategoryId", [ResidentialPropertyUpdateSchema, CommercialPropertyUpdateSchema, LandPropertyUpdateSchema]),
  }),
  getPropertyDetails: z.object({
    params: PropertyParamsSchema,
  }),
  deleteProperty: z.object({
    params: PropertyParamsSchema,
  }),
  togglePropertyStatus: z.object({
    params: PropertyParamsSchema,
  }),
  updateVerificationStatus: PropertyVerificationStatusUpdateSchema,

  togglePropertyFeaturedStatus: z.object({
    params: PropertyParamsSchema,
  }),
};

export type TCreatePropertyRequest = z.infer<typeof PropertyValidation.createProperty>["body"];
export type TUpdatePropertyRequest = z.infer<typeof PropertyValidation.updateProperty>["body"];
export type TUpdatePropertyParams = z.infer<typeof PropertyValidation.updateProperty>["params"];
export type TGetPropertyParams = z.infer<typeof PropertyValidation.getPropertyDetails>["params"];
export type TDeletePropertyParams = z.infer<typeof PropertyValidation.deleteProperty>["params"];
export type TTogglePropertyStatusParams = z.infer<typeof PropertyValidation.togglePropertyStatus>["params"];
export type TTogglePropertyFeaturedStatusParams = z.infer<typeof PropertyValidation.togglePropertyFeaturedStatus>["params"];
export type TUpdateVerificationStatusParams = z.infer<typeof PropertyValidation.updateVerificationStatus>["params"];
export type TUpdateVerificationStatusRequest = z.infer<typeof PropertyValidation.updateVerificationStatus>["body"];
