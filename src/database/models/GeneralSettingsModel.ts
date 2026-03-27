import mongoose, { type InferSchemaType, model, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const GeneralSettingSchema = new Schema(
  {
    name: DBSnippets.multilingual,

    email: {
      type: String,
      required: true,
    },

    phone: DBSnippets.phone,

    whatsapp: {
      phoneCode: {
        type: String,
        required: true,
      },

      phoneNumber: {
        type: String,
        required: true,
      },
    },
    about: DBSnippets.multilingual,

    logo: {
      type: String,
      required: false,
    },

    ...DBSnippets.common,
  },
  { timestamps: true }
);

export type TGeneralSettingsModel = InferSchemaType<typeof GeneralSettingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const GeneralSettingsModel = model<InferSchemaType<typeof GeneralSettingSchema>>("GeneralSettings", GeneralSettingSchema);
