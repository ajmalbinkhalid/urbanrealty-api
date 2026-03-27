import { parsePhoneNumberFromString } from "libphonenumber-js";
import mongoose from "mongoose";
import { z } from "zod";
import { FileHelper } from "./file-helpers";

type FileValidationOptions = {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
};

const DEFAULT_IMAGE_TYPES = Object.values(FileHelper.allowedMimeTypes);
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB

const createFileValidator = (options: FileValidationOptions = {}) => {
  const { allowedMimeTypes = DEFAULT_IMAGE_TYPES, maxFileSize = DEFAULT_MAX_SIZE } = options;

  return z
    .object({
      filepath: z.string(),
      size: z.number().max(maxFileSize, `File size must be <= ${maxFileSize / 1024 / 1024}MB`),
      mimetype: z.string().refine((m) => allowedMimeTypes.includes(m), `Allowed types: ${allowedMimeTypes.join(", ")}`),
      extension: z.string(""),
    })
    .brand<"CustomFile">();
};

export const ZodHelpers = {
  mongoId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "Invalid Id",
  }),
  file: createFileValidator(),
  fileWithOptions: createFileValidator,
  tablePagination: (additional?: Record<string, unknown>) =>
    z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
      q: z.string().optional(),
      ...additional,
    }),
  locale: z.enum(["en", "ar"]).optional(),
  email: z.email("Invalid email address").toLowerCase(),
  phone: z
    .object({
      phoneCode: z
        .string()
        .regex(/^\+?[1-9]\d{0,3}$/, "Phone code must start with + and contain only digits")
        .min(1, "Phone code is required")
        .transform((val) => (val.startsWith("+") ? val : `+${val}`)),
      phoneNumber: z.string().regex(/^\d{7,}$/, "Phone number must contain only digits and be at least 8 digits"),
    })
    .superRefine((data, ctx) => {
      const fullNumber = `${data.phoneCode}${data.phoneNumber}`;

      const phone = parsePhoneNumberFromString(fullNumber);

      if (!phone?.isValid()) {
        ctx.addIssue({
          code: "custom",
          path: ["phoneNumber"],
          message: "Invalid phone number for selected country",
        });
      }
    }),
  multilingual: (name: { name: string }) =>
    z.object({
      en: z.string().min(1, `English ${name.name} value is required`),
      ar: z.string().min(1, `Arabic ${name.name} value is required`),
    }),
  enum: <T extends number>(data: { enumObj: Record<string, T>; name?: string }) =>
    z
      .string()
      .refine((val) => Object.values(data.enumObj).includes(Number(val) as unknown as T), { message: `Invalid ${data.name ?? ""} value` })
      .transform((val) => Number(val) as T),
};
