import z from "zod";
import { CmsTypeEnum } from "@/enum/CmsTypeEnum";
import { ZodHelpers } from "@/utils/zod-helpers";

export const CmsRouterValidation = {
  updateCms: z.object({
    body: z.object({
      type: ZodHelpers.enum({ enumObj: CmsTypeEnum, name: "cmsType" }),

      privacyPolicy: z
        .object({
          pageTitle: ZodHelpers.multilingual({ name: "privacyPolicy.pageTitle" }),
          description: ZodHelpers.multilingual({ name: "privacyPolicy.description" }),
        })
        .optional(),

      termsAndConditions: z
        .object({
          pageTitle: ZodHelpers.multilingual({ name: "termsAndConditions.pageTitle" }),
          description: ZodHelpers.multilingual({ name: "termsAndConditions.description" }),
        })
        .optional(),

      faq: z
        .object({
          pageTitle: ZodHelpers.multilingual({ name: "faq.pageTitle" }),
          description: ZodHelpers.multilingual({ name: "faq.description" }),
        })
        .optional(),

      howItWorks: z
        .object({
          pageTitle: ZodHelpers.multilingual({ name: "howItWorks.pageTitle" }),
          image: ZodHelpers.file,

          title1: z.object({
            title: ZodHelpers.multilingual({ name: "title1.title" }),
            icon: ZodHelpers.file,
          }),

          title2: z.object({
            title: ZodHelpers.multilingual({ name: "title2.title" }),
            icon: ZodHelpers.file,
          }),

          title3: z.object({
            title: ZodHelpers.multilingual({ name: "title3.title" }),
            icon: ZodHelpers.file,
          }),

          title4: z.object({
            title: ZodHelpers.multilingual({ name: "title4.title" }),
            icon: ZodHelpers.file,
          }),
        })
        .optional(),
    }),
  }),
};

export type TUpdateCms = z.infer<typeof CmsRouterValidation.updateCms>["body"];
