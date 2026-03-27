import { VerificationStatusEnum } from "@enum/StatusEnum";
import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { ActorSchema, DBSnippets } from "../snippets/db-snippets";

const RejectionHistorySchema = new Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    cRNumber: {
      type: String,
      required: true,
    },
    companyEmail: {
      type: String,
      required: true,
    },
    companyPhone: DBSnippets.phoneOptional,
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    verificationRejectMessage: {
      type: String,
      required: true,
    },
    rejectedBy: {
      type: ActorSchema,
      required: true,
    },
    rejectedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false, timestamps: false }
);

const AgencySchema = new Schema(
  {
    agencyId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    cRNumber: {
      type: String,
      required: true,
    },
    companyLogo: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    companyEmail: {
      type: String,
      required: true,
    },
    companyPhone: DBSnippets.phoneOptional,
    companyWhatsapp: DBSnippets.phoneOptional,
    about: DBSnippets.multilingualOptional,
    isFeatured: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: Number,
      enum: Object.values(VerificationStatusEnum),
      default: VerificationStatusEnum.pending,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: ActorSchema,
      default: null,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "locations",
      required: false,
    },
    verificationRejectMessage: {
      type: String,
      default: null,
    },
    rejectionHistory: {
      type: [RejectionHistorySchema],
      default: [],
    },
    activeSalePropertiesCount: {
      type: Number,
      default: 0,
    },
    activeRentPropertiesCount: {
      type: Number,
      default: 0,
    },
    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

export type TAgencyModel = InferSchemaType<typeof AgencySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AgencyModel = model<TAgencyModel>("agencies", AgencySchema);
