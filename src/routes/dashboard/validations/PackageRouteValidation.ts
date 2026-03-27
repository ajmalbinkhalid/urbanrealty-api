import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";
import { PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";

const SubscriptionPackageSchema = z.object({
  type: z.literal(PackageTypeEnum.Subscription),
  userType: ZodHelpers.enum({ enumObj: UserTypeEnum, name: "User Type" }),
  name: ZodHelpers.multilingual({ name: "Name" }),
  price: z.number().positive(),
  validity: z.number().int().positive(),
  flatPrice: z.number().int().nonnegative().optional(),
  offerText: z.string("Offer Text").optional(),
  noOfProperties: z.number().int().nonnegative(),
  noOfFeaturedProperty: z.number().int().nonnegative().optional(),
});

const PromotionPackageSchema = z.object({
  type: z.literal(PackageTypeEnum.Promotion),
  userType: ZodHelpers.enum({ enumObj: UserTypeEnum, name: "User Type" }),
  name: ZodHelpers.multilingual({ name: "Name" }),
  price: z.number().positive(),
  validity: z.number().int().positive(),
  noOfFeaturedProperty: z.number().int().nonnegative(),
});

export const PackageValidation = {
  createPackage: z.object({
    body: z.discriminatedUnion("type", [SubscriptionPackageSchema, PromotionPackageSchema]),
  }),

  updatePackage: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.discriminatedUnion("type", [SubscriptionPackageSchema, PromotionPackageSchema]),
  }),

  getAllPackages: z.object({
    query: ZodHelpers.tablePagination().optional(),
  }),

  getPackageDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),

  deletePackage: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),

  toggleStatus: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
};

/* ================= TYPES ================= */

export type TCreatePackageRequest = z.infer<typeof PackageValidation.createPackage>["body"];

export type TUpdatePackageRequest = z.infer<typeof PackageValidation.updatePackage>["body"];

export type TGetPackageParams = z.infer<typeof PackageValidation.getPackageDetails>["params"];

export type TDeletePackageParams = z.infer<typeof PackageValidation.deletePackage>["params"];

export type TTogglePackageStatusParams = z.infer<typeof PackageValidation.toggleStatus>["params"];

export type TGetAllPackagesQuery = z.infer<typeof PackageValidation.getAllPackages>["query"];
