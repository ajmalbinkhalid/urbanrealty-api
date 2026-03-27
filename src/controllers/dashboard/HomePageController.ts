import { ResJson } from "@utils/response-json";
import type { Response } from "express";
import { AgencyModel } from "@/database/models/AgencyModel";
import { PropertyModel } from "@/database/models/PropertyModel";
import { UserModel } from "@/database/models/UserModel";
import { PropertyPurposeEnum } from "@/enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@/enum/StatusEnum";
import type { AdminRequest } from "@/types/admin-type";

class HomePageControllerClass {
  async getStats(_req: AdminRequest, res: Response): Promise<void> {
    try {
      const [properties, propertiesForSale, propertiesForRent, users, agencies] = await Promise.all([
        PropertyModel.countDocuments({
          status: StatusEnum.active,
          verificationStatus: VerificationStatusEnum.active,
          deletedAt: null,
        }),
        PropertyModel.countDocuments({
          purpose: PropertyPurposeEnum.Sell,
          status: StatusEnum.active,
          verificationStatus: VerificationStatusEnum.active,
          deletedAt: null,
        }),
        PropertyModel.countDocuments({
          purpose: PropertyPurposeEnum.Rent,
          status: StatusEnum.active,
          verificationStatus: VerificationStatusEnum.active,
          deletedAt: null,
        }),
        UserModel.countDocuments({
          deletedAt: null,
        }),
        AgencyModel.countDocuments({
          status: StatusEnum.active,
          verificationStatus: VerificationStatusEnum.active,
          deletedAt: null,
        }),
      ]);

      return ResJson.success(res, "Dashboard statistics retrieved successfully", {
        properties,
        propertiesForSale,
        propertiesForRent,
        users,
        agencies,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const HomePageController = new HomePageControllerClass();
