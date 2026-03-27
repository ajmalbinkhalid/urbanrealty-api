import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const FavoriteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

FavoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export type TFavoriteModel = InferSchemaType<typeof FavoriteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FavoriteModel = mongoose.model<TFavoriteModel>("favorites", FavoriteSchema);
