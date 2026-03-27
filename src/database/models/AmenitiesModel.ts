import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const AmenitiesSchema = new Schema(
  {
    amenityId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },

    name: DBSnippets.multilingual,
    icon: {
      type: String,
      required: false,
    },
    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

export type TAmenityModel = InferSchemaType<typeof AmenitiesSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AmenityModel = model<TAmenityModel>("amenities", AmenitiesSchema);
