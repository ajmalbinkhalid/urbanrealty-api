import { z } from "zod";
import { CustomerShipEnum, FurnishingEnum, LocationHubEnum, PossessionStatusEnum, PropertyCategoryEnum, PropertyConditionEnum, PropertyPurposeEnum, ZoneTypeEnum } from "@/enum/PropertyEnum";
import { ZodHelpers } from "@/utils/zod-helpers";

export const PropertyInformationBaseSchema = z.object({
  title: ZodHelpers.multilingual({ name: "Title" }),
  description: ZodHelpers.multilingual({ name: "Description" }),
  locationId: ZodHelpers.mongoId,
  address: z.string().min(1, "Address is required"),
  location: z.object({
    latitude: z.string().transform((val) => Number(val)),
    longitude: z.string().transform((val) => Number(val)),
  }),
  landmark: ZodHelpers.multilingual({ name: "Landmark" }),
  area: z
    .string()
    .min(1, "Area is required")
    .transform((val) => Number(val))
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: "Area must be a positive number",
    }),
  propertySubCategoryId: ZodHelpers.mongoId.optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !Number.isNaN(Number(val)), {
      message: "Price must be a valid number",
    })
    .refine((val) => Number(val) > 0, {
      message: "Price must be greater than 0",
    }),
  possessionStatus: ZodHelpers.enum({
    enumObj: PossessionStatusEnum,
    name: "Possession Status",
  }),
});

// RESIDENTIAL KEY FEATURES SCHEMA
// ============================================================================

export const ResidentialKeyFeaturesBaseSchema = z.object({
  noOfBedroom: z
    .string()
    .min(1, "Number of bedrooms is required")
    .transform((val) => Number(val))
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: "Number of bedrooms must be a positive number",
    }),
  noOfBathroom: z
    .string()
    .min(1, "Number of bathrooms is required")
    .transform((val) => Number(val))
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: "Number of bathrooms must be a positive number",
    }),
  propertyAge: z
    .string()
    .min(1, "Property age is required")
    .transform((val) => Number(val))
    .refine((val) => !Number.isNaN(val) && val >= 0, {
      message: "Property age must be a non-negative number",
    }),
  furnishing: ZodHelpers.enum({
    enumObj: FurnishingEnum,
    name: "Furnishing",
  }),
});

// ============================================================================
// COMMERCIAL KEY FEATURES SCHEMA
// ============================================================================

export const CommercialKeyFeaturesBaseSchema = z.object({
  totalFloor: z.string().min(1, "Total floors is required"),
  floorNumber: z.string().min(1, "Floor number is required"),
  propertyAge: z
    .string()
    .min(1, "Property age is required")
    .transform((val) => Number(val))
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: "Property age must be at least 1",
    }),
  customerShip: ZodHelpers.enum({
    enumObj: CustomerShipEnum,
    name: "Customer Ship",
  }),
  propertyCondition: ZodHelpers.enum({
    enumObj: PropertyConditionEnum,
    name: "Property Condition",
  }),
  zoneType: ZodHelpers.enum({
    enumObj: ZoneTypeEnum,
    name: "Zone Type",
  }),
  locationHub: ZodHelpers.enum({
    enumObj: LocationHubEnum,
    name: "Location Hub",
  }),
  furnishing: ZodHelpers.enum({
    enumObj: FurnishingEnum,
    name: "Furnishing",
  }),
});

// ============================================================================
// BASE PROPERTY SCHEMAS (CREATE)
// ============================================================================

export const BasePropertyCreateSchema = z.object({
  isDraft: z
    .string()
    .transform((v) => v === "1")
    .optional(),
  packageId: ZodHelpers.mongoId,
});

export const ResidentialPropertyCreateSchema = BasePropertyCreateSchema.extend({
  purpose: ZodHelpers.enum({
    enumObj: PropertyPurposeEnum,
    name: "Property Purpose",
  }),
  propertyCategoryId: z.literal(`${PropertyCategoryEnum.Residential}`),
  propertyInformation: PropertyInformationBaseSchema,
  keyFeatures: ResidentialKeyFeaturesBaseSchema,
  amenities: z.array(ZodHelpers.mongoId),
  coverImage: ZodHelpers.file,
  "galleryImages[]": z.array(ZodHelpers.file),
}).superRefine((data, ctx) => {
  if (!data.propertyInformation.propertySubCategoryId) {
    ctx.addIssue({
      code: "custom",
      path: ["propertyInformation", "propertySubCategoryId"],
      message: "Property sub-category is required for residential properties",
    });
  }
});

export const CommercialPropertyCreateSchema = BasePropertyCreateSchema.extend({
  purpose: ZodHelpers.enum({
    enumObj: PropertyPurposeEnum,
    name: "Property Purpose",
  }),
  propertyCategoryId: z.literal(`${PropertyCategoryEnum.Commercial}`),
  propertyInformation: PropertyInformationBaseSchema,
  keyFeatures: CommercialKeyFeaturesBaseSchema,
  amenities: z.array(ZodHelpers.mongoId),
  coverImage: ZodHelpers.file,
  "galleryImages[]": z.array(ZodHelpers.file),
}).superRefine((data, ctx) => {
  if (!data.propertyInformation.propertySubCategoryId) {
    ctx.addIssue({
      code: "custom",
      message: "Property sub-category is required for commercial properties",
      path: ["propertyInformation", "propertySubCategoryId"],
    });
  }
});

export const LandPropertyCreateSchema = BasePropertyCreateSchema.extend({
  purpose: ZodHelpers.enum({
    enumObj: PropertyPurposeEnum,
    name: "Property Purpose",
  }),
  propertyCategoryId: z.literal(`${PropertyCategoryEnum.Land}`),
  propertyInformation: PropertyInformationBaseSchema,
  coverImage: ZodHelpers.file,
  "galleryImages[]": z.array(ZodHelpers.file),
});

// ============================================================================
// BASE PROPERTY SCHEMAS (UPDATE)
// ============================================================================

export const BasePropertyUpdateSchema = z.object({
  isDraft: z
    .string()
    .transform((v) => v === "1")
    .optional(),
});

export const ResidentialPropertyUpdateSchema = BasePropertyUpdateSchema.extend({
  purpose: ZodHelpers.enum({
    enumObj: PropertyPurposeEnum,
    name: "Property Purpose",
  }),
  propertyCategoryId: z.literal(`${PropertyCategoryEnum.Residential}`),
  propertyInformation: PropertyInformationBaseSchema,
  keyFeatures: ResidentialKeyFeaturesBaseSchema,
  amenities: z.array(ZodHelpers.mongoId),
  coverImage: ZodHelpers.file.optional(),
  "galleryImages[]": z.array(ZodHelpers.file).optional(),
  "galleryImagePaths[]": z.array(z.string()).optional(),
});

export const CommercialPropertyUpdateSchema = BasePropertyUpdateSchema.extend({
  purpose: ZodHelpers.enum({
    enumObj: PropertyPurposeEnum,
    name: "Property Purpose",
  }),
  propertyCategoryId: z.literal(`${PropertyCategoryEnum.Commercial}`),
  propertyInformation: PropertyInformationBaseSchema,
  keyFeatures: CommercialKeyFeaturesBaseSchema,
  amenities: z.array(ZodHelpers.mongoId),
  coverImage: ZodHelpers.file.optional(),
  "galleryImages[]": z.array(ZodHelpers.file).optional(),
  "galleryImagePaths[]": z.array(z.string()).optional(),
});

export const LandPropertyUpdateSchema = BasePropertyUpdateSchema.extend({
  purpose: ZodHelpers.enum({
    enumObj: PropertyPurposeEnum,
    name: "Property Purpose",
  }),
  propertyCategoryId: z.literal(`${PropertyCategoryEnum.Land}`),
  propertyInformation: PropertyInformationBaseSchema,
  coverImage: ZodHelpers.file.optional(),
  "galleryImages[]": z.array(ZodHelpers.file).optional(),
  "galleryImagePaths[]": z.array(z.string()).optional(),
});

export const PropertyParamsSchema = z.object({
  id: ZodHelpers.mongoId,
});

export const PropertyDetailsParamsSchema = z.object({
  params: PropertyParamsSchema,
});

export const PropertyDeleteParamsSchema = z.object({
  params: PropertyParamsSchema,
});

export const PropertyToggleStatusParamsSchema = z.object({
  params: PropertyParamsSchema,
});

export const PropertyToggleFeaturedStatusParamsSchema = z.object({
  params: PropertyParamsSchema,
});

export const PropertyVerificationStatusUpdateSchema = z.object({
  params: PropertyParamsSchema,
  body: z.object({
    remarks: z.string().optional(),
    status: z.enum(["accept", "reject"], {
      error: "Verification status must be accept or reject",
    }),
  }),
});
