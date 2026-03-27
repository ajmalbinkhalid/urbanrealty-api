import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { PackageSubsciptionTypeEnum, PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";
import { DBSnippets } from "../snippets/db-snippets";

const PackageSchema = new Schema(
  {
    type: {
      type: Number,
      enum: Object.values(PackageTypeEnum), // subscription | promotion
      required: true,
    },

    subscriptionType: {
      type: String,
      enum: Object.values(PackageSubsciptionTypeEnum), // free | standard | custom
      required: false,
    },

    subscriptionId: {
      type: String,
      required: true,
      index: true,
    },
    name: DBSnippets.multilingual,

    price: {
      type: Number,
      required: true,
    },

    validity: {
      type: Number,
      required: true,
    },

    userType: {
      type: Number,
      enum: Object.values(UserTypeEnum),
    },

    flatPrice: {
      type: Number,
      default: null,
    },

    offerText: {
      type: String,
      required: false,
    },

    noOfProperties: {
      type: Number,
      default: null,
    },

    noOfFeaturedProperty: {
      type: Number,
      required: true,
    },

    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

export type TPackageModel = InferSchemaType<typeof PackageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PackageModel = model<TPackageModel>("packages", PackageSchema);
