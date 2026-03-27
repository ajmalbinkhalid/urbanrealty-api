import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { ActorSchema, DBSnippets } from "../snippets/db-snippets";

const EnquirySchema = new Schema(
  {
    enquiryId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
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
    },
    phone: DBSnippets.phone,
    message: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "users",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: ActorSchema,
      default: null,
    },
    updatedBy: {
      type: ActorSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export type TEnquiryModel = InferSchemaType<typeof EnquirySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EnquiryModel = model<TEnquiryModel>("enquiries", EnquirySchema);
