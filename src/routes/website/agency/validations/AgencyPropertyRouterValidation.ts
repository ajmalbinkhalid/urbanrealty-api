import { z } from "zod";
import {
  CommercialPropertyCreateSchema,
  CommercialPropertyUpdateSchema,
  LandPropertyCreateSchema,
  LandPropertyUpdateSchema,
  PropertyParamsSchema,
  ResidentialPropertyCreateSchema,
  ResidentialPropertyUpdateSchema,
} from "@/routes/validations/property-base-schemas";

export const WebAgencyPropertyValidation = {
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
  togglePropertyFeaturedStatus: z.object({
    params: PropertyParamsSchema,
  }),
};

export type TCreatePropertyRequest = z.infer<typeof WebAgencyPropertyValidation.createProperty>["body"];
export type TUpdatePropertyRequest = z.infer<typeof WebAgencyPropertyValidation.updateProperty>["body"];
export type TUpdatePropertyParams = z.infer<typeof WebAgencyPropertyValidation.updateProperty>["params"];
export type TGetPropertyParams = z.infer<typeof WebAgencyPropertyValidation.getPropertyDetails>["params"];
export type TDeletePropertyParams = z.infer<typeof WebAgencyPropertyValidation.deleteProperty>["params"];
export type TTogglePropertyStatusParams = z.infer<typeof WebAgencyPropertyValidation.togglePropertyStatus>["params"];
export type TTogglePropertyFeaturedStatusParams = z.infer<typeof WebAgencyPropertyValidation.togglePropertyFeaturedStatus>["params"];
