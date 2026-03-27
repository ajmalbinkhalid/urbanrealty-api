import { AgencyModel } from "@database/models/AgencyModel";
import { PropertyModel } from "@database/models/PropertyModel";
import { OwnerTypeEnum } from "@enum/OwnerTypeEnum";
import { PropertyPurposeEnum } from "@enum/PropertyEnum";
import { StatusEnum, VerificationStatusEnum } from "@enum/StatusEnum";
import logger from "@utils/logger";

export const agencyPropertyCountsSeeder = async (): Promise<void> => {
  try {
    // Get all agencies
    const agencies = await AgencyModel.find({}).lean();
    logger.info(`Processing ${agencies.length} agencies...`);

    let updatedCount = 0;

    for (const agency of agencies) {
      // Count active sale properties owned by this agency
      const activeSaleCount = await PropertyModel.countDocuments({
        "owner.ownerType": OwnerTypeEnum.agency,
        "owner.ownerId": agency._id,
        purpose: PropertyPurposeEnum.Sell,
        verificationStatus: VerificationStatusEnum.active,
        status: StatusEnum.active,
        deletedAt: null,
      });

      // Count active rent properties owned by this agency
      const activeRentCount = await PropertyModel.countDocuments({
        "owner.ownerType": OwnerTypeEnum.agency,
        "owner.ownerId": agency._id,
        purpose: PropertyPurposeEnum.Rent,
        verificationStatus: VerificationStatusEnum.active,
        status: StatusEnum.active,
        deletedAt: null,
      });

      // Update agency with calculated counts
      await AgencyModel.updateOne(
        { _id: agency._id },
        {
          activeSalePropertiesCount: activeSaleCount,
          activeRentPropertiesCount: activeRentCount,
        }
      );

      logger.info(`  ${agency.companyName}: ${activeSaleCount} sales, ${activeRentCount} rentals`);
      updatedCount++;
    }

    logger.info("✅ Agency property counts seeded successfully");
    logger.info(`  - Updated: ${updatedCount} agencies`);
  } catch (error) {
    logger.error("Agency property counts seeder failed:", error);
    throw error;
  }
};
