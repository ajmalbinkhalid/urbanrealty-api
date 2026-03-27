import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const LocationSchema = new Schema(
  {
    locationId: {
      type: String,
      unique: true,
      required: true,
    },
    city: DBSnippets.multilingual,

    ...DBSnippets.common,
  },
  { timestamps: true }
);

export type TLocationModel = InferSchemaType<typeof LocationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const LocationModel = model<TLocationModel>("locations", LocationSchema);
