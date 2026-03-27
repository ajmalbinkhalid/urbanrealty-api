import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { DBSnippets } from "../snippets/db-snippets";

const CmsSchema = new Schema(
  {
    privacyPolicy: {
      pageId: {
        type: String,
        unique: true,
      },
      pageTitle: DBSnippets.multilingualOptional,
      description: DBSnippets.multilingualOptional,
    },

    termsAndConditions: {
      pageId: {
        type: String,
        unique: true,
        required: false,
      },

      pageTitle: DBSnippets.multilingualOptional,
      description: DBSnippets.multilingualOptional,
    },

    faq: {
      pageId: {
        type: String,
        unique: true,
        required: false,
      },
      pageTitle: DBSnippets.multilingualOptional,
      description: DBSnippets.multilingualOptional,
    },

    howItWorks: {
      type: {
        pageId: {
          type: String,
          unique: true,
          required: false,
        },
        pageTitle: DBSnippets.multilingualOptional,
        image: {
          type: String,
          default: null,
          require: false,
        },
        title1: {
          type: {
            title: DBSnippets.multilingualOptional,
            icon: {
              type: String,
              required: false,
            },
          },
          required: true,
        },
        title2: {
          type: {
            title: DBSnippets.multilingualOptional,
            icon: {
              type: String,
              required: false,
            },
          },
          required: true,
        },
        title3: {
          type: {
            title: DBSnippets.multilingualOptional,
            icon: {
              type: String,
              required: false,
            },
          },
          required: true,
        },
        title4: {
          type: {
            title: DBSnippets.multilingualOptional,
            icon: {
              type: String,
              required: false,
            },
          },
          required: true,
        },
      },
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export type TCmsModel = InferSchemaType<typeof CmsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CmsModel = mongoose.model<TCmsModel>("cms", CmsSchema);
