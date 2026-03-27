import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";
import { PropertyCategoryEnum } from "@/enum/PropertyEnum";

export const SubCategoryValidation = {
  createSubCategory: z.object({
    body: z.object({
      name: ZodHelpers.multilingual({ name: "Name" }),
      propertyCategoryId: ZodHelpers.enum({ enumObj: PropertyCategoryEnum, name: "Property Category" }),
    }),
  }),
  getAllSubCategories: z.object({
    query: ZodHelpers.tablePagination().optional(),
  }),
  getSubCategoryDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  updateSubCategory: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.object({
      propertyCategoryId: ZodHelpers.enum({ enumObj: PropertyCategoryEnum, name: "Property Category" }),
      name: ZodHelpers.multilingual({ name: "Name" }),
    }),
  }),
  deleteSubCategory: z.object({
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
export type TCreateSubCategoryRequest = z.infer<typeof SubCategoryValidation.createSubCategory>["body"];
export type TGetSubCategoryParams = z.infer<typeof SubCategoryValidation.getSubCategoryDetails>["params"];
export type TGetAllSubCategoriesQuery = z.infer<typeof SubCategoryValidation.getAllSubCategories>["query"];
export type TUpdateSubCategoryParams = z.infer<typeof SubCategoryValidation.updateSubCategory>["params"];
export type TUpdateSubCategoryRequest = z.infer<typeof SubCategoryValidation.updateSubCategory>["body"];
export type TDeleteSubCategoryParams = z.infer<typeof SubCategoryValidation.deleteSubCategory>["params"];
export type TToggleStatusParams = z.infer<typeof SubCategoryValidation.toggleStatus>["params"];
