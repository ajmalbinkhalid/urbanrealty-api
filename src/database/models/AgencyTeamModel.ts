import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { VerificationStatusEnum } from "@/enum/StatusEnum";
import { DBSnippets } from "../snippets/db-snippets";

const AgencyTeamSchema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: DBSnippets.phone,
    // phoneVerifiedAt: {
    //   type: Date,
    //   default: null,
    // },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    emailVerifiedAt: {
      type: Date,
      required: false,
    },
    verificationStatus: {
      type: Number,
      enum: Object.values(VerificationStatusEnum),
      default: VerificationStatusEnum.pending,
      index: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

AgencyTeamSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      emailVerifiedAt: { $ne: null },
    },
  }
);

AgencyTeamSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phoneVerifiedAt: { $ne: null },
    },
  }
);

export type TAgencyTeamModel = InferSchemaType<typeof AgencyTeamSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AgencyTeamModel = model<TAgencyTeamModel>("agency_teams", AgencyTeamSchema);
