import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const ProfileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      immutable: true, //cannot be changed
    },

    password: {
      type: String,
      required: true,
      select: false, // never returned by default
    },

    ...DBSnippets.common,
  },
  { timestamps: true }
);

export type TProfileModel = InferSchemaType<typeof ProfileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProfileModel = model<TProfileModel>("admins", ProfileSchema);
