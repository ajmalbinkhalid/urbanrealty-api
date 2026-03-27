import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { UserTypeEnum } from "@/enum/PackageEnum";
import { DBSnippets } from "../snippets/db-snippets";

const PurchaseSchema = new Schema(
  {
    purchaseId: {
      type: Number,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
    },
    userType: {
      enum: Object.values(UserTypeEnum),
      type: Number,
    },

    packageName: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    packageType: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    price: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    validity: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    // Only for subscription
    noOfProperties: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    //  Used by BOTH (subscription and  promotion)
    noOfFeaturedProperty: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

export const PurchaseModel = model<InferSchemaType<typeof PurchaseSchema>>("purchases", PurchaseSchema);

export type TPurchaseModel = InferSchemaType<typeof PurchaseSchema> & {
  _id: mongoose.Types.ObjectId;
};
