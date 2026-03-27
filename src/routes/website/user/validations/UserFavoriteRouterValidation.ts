import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const UserFavoriteValidation = {
  toggleFavorite: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
};

export type TToggleFavoriteParams = z.infer<typeof UserFavoriteValidation.toggleFavorite>["params"];
