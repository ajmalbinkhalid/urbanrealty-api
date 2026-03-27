import { PackageSubsciptionTypeEnum, PackageTypeEnum, UserTypeEnum } from "@/enum/PackageEnum";
import logger from "@/utils/logger";
import { PackageModel } from "../models/PackageModel";

export const freePackage = async () => {
  try {
    // Create free package for Agent
    const _agentFreePackage = await PackageModel.create({
      type: PackageTypeEnum.Subscription,
      subscriptionType: PackageSubsciptionTypeEnum.Free,
      subscriptionId: "SP-1000",
      name: {
        en: "Free",
        ar: "مجاني",
      },
      price: 0,
      validity: 0,
      userType: UserTypeEnum.Agent,
      flatPrice: null,
      offerText: null,
      noOfProperties: null,
      noOfFeaturedProperty: 0,
    });

    logger.info("Free package for Agent created successfully");

    // Create free package for Customer
    const _customerFreePackage = await PackageModel.create({
      type: PackageTypeEnum.Subscription,
      subscriptionType: PackageSubsciptionTypeEnum.Free,
      subscriptionId: "SP-1001",
      name: {
        en: "Free",
        ar: "مجاني",
      },
      price: 0,
      validity: 0,
      userType: UserTypeEnum.Customer,
      flatPrice: null,
      offerText: null,
      noOfProperties: null,
      noOfFeaturedProperty: 0,
    });

    logger.info("Free package for Customer created successfully");
  } catch (error) {
    logger.error("Error in freePackage seeder:", error);
    throw error;
  }
};
