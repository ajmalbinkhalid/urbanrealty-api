import { z } from "zod";

export const CustomPackageValidation = {
  createCustomPackageDetails: z.object({
    body: z.object({
      noOfProperties: z.number(),
      noOfFeaturedProperty: z.number(),
      validity: z.number(),
    }),
  }),
};

export type TCreateCustomPackageDetails = z.infer<typeof CustomPackageValidation.createCustomPackageDetails>["body"];
