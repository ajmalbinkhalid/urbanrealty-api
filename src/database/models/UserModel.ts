import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const UserSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    currentPackage: {
      type: {
        packageId: {
          type: Schema.Types.ObjectId,
          ref: "packages",
        },
        packagePeriod: {
          type: {
            startDate: {
              type: Date,
              required: true,
            },
            endDate: {
              type: Date,
              required: true,
            },
          },
        },
        propertyCount: {
          type: Number,
          default: 0,
        },
        validity: {
          type: Number,
          required: true,
        },
      },
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: DBSnippets.phone,
    emailVerifiedAt: { type: Date, default: null },
    // phoneVerifiedAt: { type: Date, default: null },
    logo: {
      type: String,
      required: false,
      default: null,
    },
    recentlyViewedProperties: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "properties" }],
      default: [],
    },
    isProfileCompleted: {
      type: Date,
      default: null,
    },
    ...DBSnippets.common,
  },
  { timestamps: true }
);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      emailVerifiedAt: { $ne: null },
    },
  }
);

UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phoneVerifiedAt: { $ne: null },
    },
  }
);

export type TUserModel = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel = model<TUserModel>("users", UserSchema);
