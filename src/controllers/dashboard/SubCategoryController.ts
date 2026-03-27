import { ResJson } from "@utils/response-json";
import type { Response } from "express";
import { getNextSequence } from "@/database/models/CounterModel";
import { PropertyModel } from "@/database/models/PropertyModel";
import { SubCategoryModel, type TSubCategoryModel } from "@/database/models/SubCategoryModel";
import { StatusEnum } from "@/enum/StatusEnum";
import type { TCreateSubCategoryRequest, TDeleteSubCategoryParams, TGetSubCategoryParams, TToggleStatusParams, TUpdateSubCategoryParams, TUpdateSubCategoryRequest } from "@/routes/dashboard/validations/SubCategoryRouterValidation";
import type { AdminRequest } from "@/types/admin-type";
import { DBHelper } from "@/utils/db-helpers";

class SubCategoryControllerClass {
  static getSubCategory(subCategory: TSubCategoryModel): Record<string, unknown> {
    return {
      _id: subCategory._id,
      name: {
        en: subCategory.name.en,
        ar: subCategory.name.ar,
      },
      propertyCategoryId: subCategory.propertyCategoryId,
      status: subCategory.status,
      createdAt: subCategory.createdAt,
      createdBy: subCategory.createdBy,
    };
  }

  async createSubCategory(req: AdminRequest, res: Response): Promise<void> {
    const session = await SubCategoryModel.startSession();
    session.startTransaction();
    try {
      const { name, propertyCategoryId } = req.body as TCreateSubCategoryRequest;

      const exists = await SubCategoryModel.findOne({
        $or: [{ "name.en": name.en, "name.ar": name.ar, propertyCategoryId }],
        deletedAt: null,
      })
        .session(session)
        .lean();

      if (exists) {
        await session.abortTransaction();
        return ResJson.invalid(res, "Category already exists");
      }

      const subCategoryId = await getNextSequence("subCategoryId", session);
      const category = await SubCategoryModel.create(
        [
          {
            subCategoryId,
            name,
            propertyCategoryId,
            createdBy: DBHelper.actor(req),
            updatedBy: DBHelper.actor(req),
          },
        ],
        { session }
      );

      await session.commitTransaction();

      ResJson.success(res, "Category created successfully", {
        category: SubCategoryControllerClass.getSubCategory(category[0]),
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async getAllSubCategories(req: AdminRequest, res: Response): Promise<void> {
    try {
      const result = await DBHelper.fetch({
        model: SubCategoryModel,
        req,
        searchFields: ["name.en", "name.ar", "subCategoryId"],
        projection: {
          _id: 1,
          subCategoryId: 1,
          name: {
            en: 1,
            ar: 1,
          },
          propertyCategoryId: 1,
          status: 1,
          createdAt: 1,
          createdBy: 1,
        },
      });

      return ResJson.success(res, "SubCategories fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getSubCategoryDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetSubCategoryParams;

      const category = await SubCategoryModel.findOne({
        _id: id,
        deletedAt: null,
      })
        .select("subCategoryId name propertyCategoryId status")
        .lean();

      if (!category) {
        return ResJson.notFound(res, "Category not found");
      }

      return ResJson.success(res, "Category fetched", {
        category: SubCategoryControllerClass.getSubCategory(category),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async updateSubCategory(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TUpdateSubCategoryParams;
      const { name, propertyCategoryId } = req.body as TUpdateSubCategoryRequest;

      const category = await SubCategoryModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!category) {
        return ResJson.notFound(res, "Category not found");
      }

      const existingProperties = await PropertyModel.find({ deletedAt: null, "propertyInformation.propertySubCategoryId": category._id });

      if (existingProperties && propertyCategoryId) {
        return ResJson.notFound(res, "Cannot update category because properties already exist under this subcategory.");
      }

      category.name = name;
      category.propertyCategoryId = propertyCategoryId;
      category.updatedBy = DBHelper.actor(req);
      category.updatedAt = new Date();

      await category.save();

      return ResJson.success(res, "Category updated successfully", {
        category: SubCategoryControllerClass.getSubCategory(category),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async toggleSubCategoryStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TToggleStatusParams;

      const category = await SubCategoryModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!category) {
        return ResJson.notFound(res, "Category not found");
      }

      category.status = category.status === StatusEnum.active ? StatusEnum.inactive : StatusEnum.active;
      category.updatedAt = new Date();
      category.updatedBy = DBHelper.actor(req);

      await category.save();

      return ResJson.success(res, `Category ${category.status === StatusEnum.active ? "activated" : "deactivated"} successfully`, {
        category: SubCategoryControllerClass.getSubCategory(category),
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async deleteSubCategory(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TDeleteSubCategoryParams;

      const category = await SubCategoryModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!category) {
        return ResJson.notFound(res, "Category not found");
      }

      category.deletedAt = new Date();
      category.deletedBy = DBHelper.actor(req);

      await category.save();

      return ResJson.success(res, "Category deleted successfully");
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
  async getSubCategoryDropdown(_req: AdminRequest, res: Response): Promise<void> {
    try {
      const subCategories = await SubCategoryModel.find({
        deletedAt: null,
      }).lean();

      if (!subCategories) {
        return ResJson.notFound(res, "subCategory not found");
      }

      return ResJson.success(res, "subCategory fetched", {
        subCategories,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const SubCategoryController = new SubCategoryControllerClass();
