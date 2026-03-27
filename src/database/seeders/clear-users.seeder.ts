import readline from "node:readline";
import { AgencyModel } from "@database/models/AgencyModel";
import { AgencyTeamModel } from "@database/models/AgencyTeamModel";
import { EnquiryModel } from "@database/models/EnquiryModel";
import { FavoriteModel } from "@database/models/FavoriteModel";
import { NotificationTokenModel } from "@database/models/NotificationTokenModel";
import { OTPSessionModel } from "@database/models/OtpSessionModel";
import { PropertyModel } from "@database/models/PropertyModel";
import { PurchaseModel } from "@database/models/PurchaseModel";
import { UserModel } from "@database/models/UserModel";
import logger from "@utils/logger";
import { PackageModel } from "../models/PackageModel";

type DeletionStats = {
  [key: string]: number;
};

const promptConfirmation = (): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("WARNING: This will permanently delete all user-related data. Are you sure? (yes/no): ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
};

export const clearUsersSeeder = async (): Promise<void> => {
  try {
    // Request confirmation before proceeding
    const confirmed = await promptConfirmation();

    if (!confirmed) {
      logger.info("Deletion cancelled by user");
      process.exit(0);
    }

    const deletionStats: DeletionStats = {};
    let totalDeleted = 0;

    // Delete in reverse dependency order
    // 1. Delete Favorites (depends on User & Property)
    logger.info("Clearing Favorites...");
    let result = await FavoriteModel.deleteMany({});
    deletionStats.Favorite = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} Favorite documents`);

    // 2. Delete Enquiries (depends on User & Property)
    logger.info("Clearing Enquiries...");
    result = await EnquiryModel.deleteMany({});
    deletionStats.Enquiry = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} Enquiry documents`);

    // 3. Delete Notification Tokens (depends on User)
    logger.info("Clearing Notification Tokens...");
    result = await NotificationTokenModel.deleteMany({});
    deletionStats.NotificationToken = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} NotificationToken documents`);

    // 4. Delete Properties (can be owned by User or Agency)
    logger.info("Clearing Properties...");
    result = await PropertyModel.deleteMany({});
    deletionStats.Property = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} Property documents`);

    // 5. Delete Agency Teams (depends on Agency)
    logger.info("Clearing Agency Teams...");
    result = await AgencyTeamModel.deleteMany({});
    deletionStats.AgencyTeam = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} AgencyTeam documents`);

    // 6. Delete Agencies (base entity)
    logger.info("Clearing Agencies...");
    result = await AgencyModel.deleteMany({});
    deletionStats.Agency = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} Agency documents`);

    // 7. Delete Users (base entity)
    logger.info("Clearing Users...");
    result = await UserModel.deleteMany({});
    deletionStats.User = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} User documents`);

    // 8. Delete Purchases (optional User reference)
    logger.info("Clearing Purchases...");
    result = await PurchaseModel.deleteMany({});
    deletionStats.Purchase = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} Purchase documents`);

    // 9. Delete OTP Sessions (independent collection with TTL)
    logger.info("Clearing OTP Sessions...");
    result = await OTPSessionModel.deleteMany({});
    deletionStats.OTPSession = result.deletedCount;
    totalDeleted += result.deletedCount;
    logger.info(`Cleared ${result.deletedCount} OTPSession documents`);

    // // 10. Delete Packages (independent collection with TTL)
    // logger.info("Clearing Packages...");
    // result = await PackageModel.deleteMany({});
    // deletionStats.Package = result.deletedCount;
    // totalDeleted += result.deletedCount;
    // logger.info(`Cleared ${result.deletedCount} Package documents`);

    // Log final summary
    logger.info("Deletion Statistics:");
    logger.info(`   Total deleted: ${totalDeleted} documents`);
    logger.info("   Breakdown:");

    for (const [model, count] of Object.entries(deletionStats)) {
      logger.info(`     • ${model}: ${count}`);
    }
  } catch (error) {
    logger.error("Error clearing user data:", error);
    process.exit(1);
  }
};
