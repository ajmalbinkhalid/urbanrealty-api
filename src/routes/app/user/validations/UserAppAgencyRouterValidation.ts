import { z } from "zod";
import { ZodHelpers } from "@/utils/zod-helpers";

export const GetOneAgencySchema = z.object({
  params: z.object({
    id: ZodHelpers.mongoId,
  }),
});

export type TGetOneAgency = z.infer<typeof GetOneAgencySchema>;
