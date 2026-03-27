import mongoose, { type InferSchemaType, Schema } from "mongoose";
import { OwnerTypeEnum } from "@/enum/OwnerTypeEnum";
import { PackageSubsciptionTypeEnum, PackageTypeEnum } from "@/enum/PackageEnum";
import { CustomerShipEnum, FurnishingEnum, LocationHubEnum, PossessionStatusEnum, PropertyCategoryEnum, PropertyConditionEnum, PropertyPurposeEnum, ZoneTypeEnum } from "@/enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { AdminRequest } from "@/types/admin-type";
import type { AgencyRequest } from "@/types/agency-type";
import type { UserRequest } from "@/types/user-type";
import { FileHelper } from "@/utils/file-helpers";
import { DBSnippets } from "../snippets/db-snippets";
import { AgencyModel } from "./AgencyModel";
import { GeneralSettingsModel } from "./GeneralSettingsModel";
import { UserModel } from "./UserModel";

const PropertySchema = new Schema(
  {
    propertyId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    purpose: {
      type: Number,
      enum: Object.values(PropertyPurposeEnum),
    },
    propertyCategoryId: {
      type: Number,
      enum: Object.values(PropertyCategoryEnum),
    },

    packageDetails: {
      type: {
        packageId: {
          type: Schema.Types.ObjectId,
          ref: "packages",
          required: false,
          default: null,
        },
        packageType: {
          type: Number,
          enum: Object.values(PackageTypeEnum),
          required: false,
        },
        subscriptionType: {
          type: String,
          enum: Object.values(PackageSubsciptionTypeEnum),
          required: false,
        },
      },
    },

    propertyInformation: {
      required: true,
      type: {
        title: DBSnippets.multilingual,

        description: DBSnippets.multilingual,

        area: {
          type: Number,
          min: 1,
          required: true,
        },

        locationId: {
          type: Schema.Types.ObjectId,
          required: true,
        },

        address: {
          type: String,
          required: false,
        },

        location: {
          type: {
            type: String,
            enum: ["Point"],
            required: true,
          },
          coordinates: {
            type: [Number],
            required: true,
          },
        },

        landmark: DBSnippets.multilingual,

        propertySubCategoryId: {
          type: Schema.Types.ObjectId,
          required: false,
          default: null,
        },

        price: {
          type: String,
          required: true,
        },

        possessionStatus: {
          type: Number,
          enum: Object.values(PossessionStatusEnum),
          required: true,
        },
      },
    },

    keyFeatures: {
      propertyAge: {
        type: Number,
        required: false,
      },

      //RESIDENTIAL
      noOfBedroom: {
        type: Number,
        required: false,
      },
      noOfBathroom: {
        type: Number,
        required: false,
      },
      furnishing: {
        type: Number,
        enum: Object.values(FurnishingEnum),
        required: false,
      },

      //COMMERCIAL

      totalFloor: {
        type: String,
        required: false,
      },

      floorNumber: {
        type: String,
        required: false,
      },
      customerShip: {
        type: Number,
        enum: Object.values(CustomerShipEnum),
        required: false,
      },
      propertyCondition: {
        type: Number,
        enum: Object.values(PropertyConditionEnum),
        required: false,
      },
      zoneType: {
        type: Number,
        enum: Object.values(ZoneTypeEnum),
        required: false,
      },
      locationHub: {
        type: Number,
        enum: Object.values(LocationHubEnum),
        required: false,
      },
    },

    amenitiesId: [
      {
        type: Schema.Types.ObjectId,
        required: false,
      },
    ],

    coverImage: {
      type: String,
      required: true,
    },

    galleryImages: {
      type: [String],
      required: true,
    },

    owner: {
      type: {
        ownerType: {
          type: Number,
          enum: Object.values(OwnerTypeEnum),
          required: true,
        },
        ownerId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        // Only when ownerType === AGENCY
        agencyMemberId: {
          type: Schema.Types.ObjectId,
          default: null,
        },
      },
      required: true,
    },

    verificationStatus: {
      type: Number,
      enum: Object.values(VerificationStatusEnum),
      default: VerificationStatusEnum.pending,
    },

    verifiedAt: {
      type: Date,
      required: false,
      default: null,
    },

    verificationRejectMessage: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "admins",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    viewed: {
      type: Number,
      default: 0,
      min: 0,
    },

    ...DBSnippets.common,
  },
  {
    timestamps: true,
  }
);

PropertySchema.index({ "propertyInformation.location": "2dsphere" });

export type TPropertyModel = InferSchemaType<typeof PropertySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PropertyModel = mongoose.model<TPropertyModel>("properties", PropertySchema);

export const getPropertyOwner = (req: AgencyRequest | AdminRequest | UserRequest) => {
  if ("agency" in req && req.agency?.agencyTeamId) {
    return {
      ownerType: OwnerTypeEnum.agency,
      ownerId: req.agency.agencyId,
      agencyMemberId: req.agency.agencyTeamId,
    };
  }
  if ("user" in req && req.user?.userId) {
    return {
      ownerType: OwnerTypeEnum.user,
      ownerId: req.user.userId,
    };
  }

  if ("admin" in req && req.admin?.adminId) {
    return {
      ownerType: OwnerTypeEnum.admin,
      ownerId: req.admin.adminId,
    };
  }

  return {
    ownerType: OwnerTypeEnum.admin,
    ownerId: (req as AdminRequest).admin.adminId,
  };
};

export const getPropertyOwnerDetails = async (owner: TPropertyModel["owner"]) => {
  let name: string | undefined;
  let id: string | undefined;
  let email: string | undefined;
  let phone: { phoneCode: string; phoneNumber: string } | undefined;
  let image: string | undefined;
  let whatsApp: { phoneCode: string; phoneNumber: string } | undefined;
  let totalRentCount: number | undefined;
  let totalSaleCount: number | undefined;
  const settings = await GeneralSettingsModel.findOne().lean();

  if (owner.ownerType === OwnerTypeEnum.admin) {
    id = "AD-001";
    name = settings?.name.en;
    image = settings?.logo ?? undefined;
    email = settings?.email;
    phone = settings?.phone;
    whatsApp = settings?.whatsapp ?? undefined;
    totalRentCount = await PropertyModel.countDocuments({
      "owner.ownerType": OwnerTypeEnum.admin,
      purpose: PropertyPurposeEnum.Rent,
      status: StatusEnum.active,
      deletedAt: null,
    });
    totalSaleCount = await PropertyModel.countDocuments({
      "owner.ownerType": OwnerTypeEnum.admin,
      "owner.ownerId": owner.ownerId,
      purpose: PropertyPurposeEnum.Sell,
      status: StatusEnum.active,
      deletedAt: null,
    });
  } else if (owner.ownerType === OwnerTypeEnum.agency) {
    const agency = await AgencyModel.findOne({
      _id: owner.ownerId,
      deletedAt: null,
    }).lean();

    name = agency?.companyName;
    id = agency?.agencyId;
    email = agency?.companyEmail;
    image = agency?.companyLogo ?? undefined;
    totalRentCount = agency?.activeRentPropertiesCount;
    totalSaleCount = agency?.activeSalePropertiesCount;
    phone = agency?.companyPhone;
    whatsApp = agency?.companyWhatsapp ?? undefined;
  } else if (owner.ownerType === OwnerTypeEnum.user) {
    const user = await UserModel.findOne({
      _id: owner.ownerId,
      deletedAt: null,
    }).lean();

    name = user ? `${user.firstName} ${user.lastName}` : undefined;
    id = user?.userId;
    email = user?.email;
    image = user?.logo ?? undefined;
    totalRentCount = await PropertyModel.countDocuments({
      "owner.ownerType": OwnerTypeEnum.user,
      "owner.ownerId": owner.ownerId,
      purpose: PropertyPurposeEnum.Rent,
      status: StatusEnum.active,
      verificationStatus: VerificationStatusEnum.active,
      deletedAt: null,
    });
    totalSaleCount = await PropertyModel.countDocuments({
      "owner.ownerType": OwnerTypeEnum.user,
      "owner.ownerId": owner.ownerId,
      status: StatusEnum.active,
      verificationStatus: VerificationStatusEnum.active,
      purpose: PropertyPurposeEnum.Sell,
      deletedAt: null,
    });
  }

  if (!image) {
    image = settings?.logo ?? undefined;
  }
  return { ownerType: owner.ownerType, name, id, email, image: FileHelper.getUrl(image), phone, whatsApp, totalRentCount, totalSaleCount };
};
