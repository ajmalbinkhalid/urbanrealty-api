import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const PurchaseValidation = {
  createPurchase: z.object({
    body: z.object({
      purchaseId: z.number().int().positive(),

      user: ZodHelpers.mongoId.optional(),
      packageId: ZodHelpers.mongoId,

      status: z.number().optional(),
    }),
  }),
  getAllPurchases: z.object({
    query: ZodHelpers.tablePagination().optional(),
  }),

  getPurchaseDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),

  updatePurchase: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.object({
      status: z.number(),
    }),
  }),
};
export type TCreatePurchaseRequest = z.infer<typeof PurchaseValidation.createPurchase>["body"];

export type TGetAllPurchasesQuery = z.infer<typeof PurchaseValidation.getAllPurchases>["query"];

export type TGetPurchaseParams = z.infer<typeof PurchaseValidation.getPurchaseDetails>["params"];
