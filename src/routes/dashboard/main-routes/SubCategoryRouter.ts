import express, { type Router } from "express";
import { SubCategoryController } from "@/controllers/dashboard/SubCategoryController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { SubCategoryValidation } from "../validations/SubCategoryRouterValidation";

export const SubCategoryRouter: Router = express.Router();

SubCategoryRouter.get("/", validateRequest(SubCategoryValidation.getAllSubCategories), SubCategoryController.getAllSubCategories);
SubCategoryRouter.get("/all", validateRequest(SubCategoryValidation.getAllSubCategories), SubCategoryController.getSubCategoryDropdown);
SubCategoryRouter.post("/", validateRequest(SubCategoryValidation.createSubCategory), SubCategoryController.createSubCategory);
SubCategoryRouter.get("/:id", validateRequest(SubCategoryValidation.getSubCategoryDetails), SubCategoryController.getSubCategoryDetails);
SubCategoryRouter.put("/:id", validateRequest(SubCategoryValidation.updateSubCategory), SubCategoryController.updateSubCategory);
SubCategoryRouter.delete("/:id", validateRequest(SubCategoryValidation.deleteSubCategory), SubCategoryController.deleteSubCategory);
SubCategoryRouter.patch("/:id/status", validateRequest(SubCategoryValidation.toggleStatus), SubCategoryController.toggleSubCategoryStatus);
