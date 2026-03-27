import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const AmenityValidation = {
  createAmenity: z.object({
    body: z.object({
      name: ZodHelpers.multilingual({ name: "Name" }),
      icon: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }),
    }),
  }),
  getAllAmenities: z.object({
    query: ZodHelpers.tablePagination().optional(),
  }),
  getAmenityDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  updateAmenity: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.object({
      name: ZodHelpers.multilingual({ name: "Name" }),
      icon: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),
    }),
  }),
  deleteAmenity: z.object({
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
export type TCreateAmenityRequest = z.infer<typeof AmenityValidation.createAmenity>["body"];
export type TGetAmenityParams = z.infer<typeof AmenityValidation.getAmenityDetails>["params"];
export type TGetAllAmenitiesQuery = z.infer<typeof AmenityValidation.getAllAmenities>["query"];
export type TUpdateAmenityParams = z.infer<typeof AmenityValidation.updateAmenity>["params"];
export type TUpdateAmenityRequest = z.infer<typeof AmenityValidation.updateAmenity>["body"];
export type TDeleteAmenityParams = z.infer<typeof AmenityValidation.deleteAmenity>["params"];
export type TToggleStatusParams = z.infer<typeof AmenityValidation.toggleStatus>["params"];
