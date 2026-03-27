import { Schema } from "mongoose";
import { ActorTypeEnum } from "@/enum/actor-type-enum";
import { StatusEnum } from "@/enum/StatusEnum";

export const ActorSchema = new Schema(
  {
    actorType: {
      type: Number,
      enum: Object.values(ActorTypeEnum),
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

const PhoneSchema = new Schema(
  {
    phoneCode: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const MultiLingualSchema = new Schema(
  {
    en: {
      type: String,
      required: true,
    },
    ar: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);



export const DBSnippets = {
  common: {
    status: {
      type: Number,
      enum: Object.values(StatusEnum),
      default: StatusEnum.active,
    },
    createdBy: {
      type: ActorSchema,
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
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  multilingual: {
    type: MultiLingualSchema,
    required: true,
  },
  multilingualOptional: {
    type: MultiLingualSchema,
    required: false,
  },
  phone: {
    type: PhoneSchema,
    required: true,
  },
  phoneOptional: {
    type: PhoneSchema,
    required: false,
  },
};
