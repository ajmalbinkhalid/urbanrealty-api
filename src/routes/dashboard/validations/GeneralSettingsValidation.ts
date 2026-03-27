import { z } from "zod";
import { ZodHelpers } from "@/utils/zod-helpers";

export const GeneralSettingsValidation = {
  update: z.object({
    body: z.object({
      name: ZodHelpers.multilingual({ name: "Name" }),

      email: ZodHelpers.email,

      phone: ZodHelpers.phone,

      whatsapp: ZodHelpers.phone,
      logo: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),

      about: ZodHelpers.multilingual({ name: "About" }).optional(),

      // currency: z.enum(["USD", "AED", "INR", "EUR"]).optional(),
    }),
  }),
};
export type TUpdateGeneralSettings = z.infer<typeof GeneralSettingsValidation.update>["body"];
