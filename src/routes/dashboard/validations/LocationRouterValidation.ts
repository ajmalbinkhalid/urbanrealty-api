import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const LocationValidation = {
  createLocation: z.object({
    body: z.object({
      city: ZodHelpers.multilingual({ name: "City" }),
    }),
  }),
  getAllLocations: z.object({
    query: ZodHelpers.tablePagination().optional(),
  }),
  getLocationDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  updateLocation: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.object({
      city: ZodHelpers.multilingual({ name: "City" }),
    }),
  }),
  deleteLocation: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  toggleStatus: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
};

// Type exports for type-safe request handling
export type TCreateLocationRequest = z.infer<typeof LocationValidation.createLocation>["body"];
export type TGetLocationParams = z.infer<typeof LocationValidation.getLocationDetails>["params"];
export type TGetAllLocationsQuery = z.infer<typeof LocationValidation.getAllLocations>["query"];
export type TUpdateLocationParams = z.infer<typeof LocationValidation.updateLocation>["params"];
export type TUpdateLocationRequest = z.infer<typeof LocationValidation.updateLocation>["body"];
export type TDeleteLocationParams = z.infer<typeof LocationValidation.deleteLocation>["params"];
export type TToggleStatusParams = z.infer<typeof LocationValidation.toggleStatus>["params"];
