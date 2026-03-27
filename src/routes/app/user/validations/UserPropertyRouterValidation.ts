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

export const AppUserPropertyValidation = {
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

export type TCreatePropertyRequest = z.infer<typeof AppUserPropertyValidation.createProperty>["body"];
export type TUpdatePropertyRequest = z.infer<typeof AppUserPropertyValidation.updateProperty>["body"];
export type TUpdatePropertyParams = z.infer<typeof AppUserPropertyValidation.updateProperty>["params"];
export type TGetPropertyParams = z.infer<typeof AppUserPropertyValidation.getPropertyDetails>["params"];
export type TDeletePropertyParams = z.infer<typeof AppUserPropertyValidation.deleteProperty>["params"];
export type TTogglePropertyStatusParams = z.infer<typeof AppUserPropertyValidation.togglePropertyStatus>["params"];
export type TTogglePropertyFeaturedStatusParams = z.infer<typeof AppUserPropertyValidation.togglePropertyFeaturedStatus>["params"];
