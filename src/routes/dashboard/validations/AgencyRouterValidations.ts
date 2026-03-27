import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const AgencyValidation = {
  getAllAgencies: z.object({
    query: ZodHelpers.tablePagination({
      status: z.enum(["pending", "active", "rejected"]).optional(),
    }).optional(),
  }),
  createAgency: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      // phone: ZodHelpers.phone,
      companyPhone: ZodHelpers.phone.optional(),
      email: ZodHelpers.email,
      companyName: z.string().min(2, "Company name must be at least 2 characters"),
      cRNumber: z.string().min(1, "CR number is required"),
      about: z
        .object({
          en: z.string().optional(),
          ar: z.string().optional(),
        })
        .optional(),
      companyWhatsapp: z
        .object({
          phoneCode: z.string().optional(),
          phoneNumber: z.string().optional(),
        })
        .optional(),
      companyLogo: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),
      coverImage: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),
    }),
  }),
  getAgencyDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  updateAgency: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      companyName: z.string().min(2, "Company name must be at least 2 characters"),
      cRNumber: z.string().min(1, "CR number is required"),
      companyEmail: z.string().email("Please enter a valid company email address"),
      companyPhone: z
        .object({
          phoneCode: z.string().min(1, "Company phone country code is required").optional(),
          phoneNumber: z.string().min(1, "Company phone country code is required").optional(),
        })
        .optional(),
      companyWhatsapp: z
        .object({
          phoneCode: z.string().min(1, "WhatsApp country code is required").optional(),
          phoneNumber: z.string().min(1, "WhatsApp country code is required").optional(),
        })
        .optional(),

      about: z
        .object({
          en: z.string().optional(),
          ar: z.string().optional(),
        })
        .optional(),

      companyLogo: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),
      coverImage: ZodHelpers.fileWithOptions({ maxFileSize: 3 * 1024 * 1024 }).optional(),
      email: ZodHelpers.email,
      // phone: ZodHelpers.phone,
    }),
  }),
  deleteAgency: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  toggleFeatured: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  toggleStatus: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  updateVerificationStatus: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.object({
      remarks: z.string().min(1, "Remarks is required").optional(),
      status: z.enum(["accept", "reject"], {
        error: "Verification status must be accept or reject",
      }),
    }),
  }),
};

// Type exports for type-safe request handling
export type TGetAllAgenciesQuery = z.infer<typeof AgencyValidation.getAllAgencies>["query"];
export type TCreateAgencyRequest = z.infer<typeof AgencyValidation.createAgency>["body"];
export type TGetAgencyParams = z.infer<typeof AgencyValidation.getAgencyDetails>["params"];
export type TUpdateAgencyParams = z.infer<typeof AgencyValidation.updateAgency>["params"];
export type TUpdateAgencyRequest = z.infer<typeof AgencyValidation.updateAgency>["body"];
export type TDeleteAgencyParams = z.infer<typeof AgencyValidation.deleteAgency>["params"];
export type TToggleFeaturedParams = z.infer<typeof AgencyValidation.toggleFeatured>["params"];
export type TToggleStatusParams = z.infer<typeof AgencyValidation.toggleStatus>["params"];
export type TUpdateVerificationStatusParams = z.infer<typeof AgencyValidation.updateVerificationStatus>["params"];
export type TUpdateVerificationStatusRequest = z.infer<typeof AgencyValidation.updateVerificationStatus>["body"];
