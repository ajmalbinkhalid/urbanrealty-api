import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { PropertyCategoryEnum } from "@/enum/PropertyEnum";
import { DBSnippets } from "../snippets/db-snippets";

const SubCategorySchema = new Schema(
  {
    subCategoryId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    name: DBSnippets.multilingual,
    propertyCategoryId: {
      type: Number,
      enum: Object.values(PropertyCategoryEnum),
      required: true,
    },
    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

export type TSubCategoryModel = InferSchemaType<typeof SubCategorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SubCategoryModel = model<TSubCategoryModel>("sub_categories", SubCategorySchema);
