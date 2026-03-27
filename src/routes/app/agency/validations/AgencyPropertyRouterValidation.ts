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

export const AppAgencyPropertyValidation = {
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

export type TCreatePropertyRequest = z.infer<typeof AppAgencyPropertyValidation.createProperty>["body"];
export type TUpdatePropertyRequest = z.infer<typeof AppAgencyPropertyValidation.updateProperty>["body"];
export type TUpdatePropertyParams = z.infer<typeof AppAgencyPropertyValidation.updateProperty>["params"];
export type TGetPropertyParams = z.infer<typeof AppAgencyPropertyValidation.getPropertyDetails>["params"];
export type TDeletePropertyParams = z.infer<typeof AppAgencyPropertyValidation.deleteProperty>["params"];
export type TTogglePropertyStatusParams = z.infer<typeof AppAgencyPropertyValidation.togglePropertyStatus>["params"];
export type TTogglePropertyFeaturedStatusParams = z.infer<typeof AppAgencyPropertyValidation.togglePropertyFeaturedStatus>["params"];
