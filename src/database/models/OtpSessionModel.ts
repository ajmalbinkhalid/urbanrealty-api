import { OTPSourceEnum } from "@enum/OTPSourceEnum";
import { type InferSchemaType, model, Schema } from "mongoose";

const OTPSessionSchema = new Schema(
  {
    identifier: {
      type: String,
      required: true,
    },
    identifierType: {
      type: String,
      required: true,
    },
    source: {
      type: Number,
      enum: Object.values(OTPSourceEnum),
    },
    otp: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      required: false,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Instance methods
OTPSessionSchema.methods.canResend = function (minResendIntervalSeconds: number): boolean {
  if (!this.lastSentAt) {
    return true;
  }

  const timeSinceLastSend = Date.now() - this.lastSentAt.getTime();
  return timeSinceLastSend >= minResendIntervalSeconds * 1000;
};

type OTPSessionMethods = {
  canResend(minResendIntervalSeconds: number): boolean;
};

type OTPSession = InferSchemaType<typeof OTPSessionSchema> & OTPSessionMethods;

export const OTPSessionModel = model<OTPSession>("otp_sessions", OTPSessionSchema);
