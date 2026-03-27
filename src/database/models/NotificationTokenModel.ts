import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { ActorTypeEnum } from "@/enum/actor-type-enum";
import { PlatformTypeEnum } from "@/enum/PlatformTypeEnum";

const NotificationTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userType: {
      type: Number,
      enum: Object.values(ActorTypeEnum),
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    platform: {
      type: Number,
      enum: Object.values(PlatformTypeEnum),
      required: true,
    },
  },

  { timestamps: true }
);

export type TNotificationTokenModel = InferSchemaType<typeof NotificationTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const NotificationTokenModel = model<TNotificationTokenModel>("notification_tokens", NotificationTokenSchema);
