import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const AdminSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    ...DBSnippets.common,
  },
  { timestamps: true }
);

export type TAdminModel = InferSchemaType<typeof AdminSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminModel = model<InferSchemaType<typeof AdminSchema>>("admins", AdminSchema);
