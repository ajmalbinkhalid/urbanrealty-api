import logger from "@utils/logger";
import { adminSeeder } from "./admin.seeder";
import { agencyPropertyCountsSeeder } from "./agency-property-counts.seeder";
import { clearUsersSeeder } from "./clear-users.seeder";
import { cmsSeeder } from "./cms.seeder";
import { freePackage } from "./free-package.seeder";
import { settingsSeeder } from "./settings.seeder";

type Seeder = {
  name: string;
  run: () => Promise<void>;
};

const seeders: Seeder[] = [
  {
    name: "admin",
    run: adminSeeder,
  },
  {
    name: "settings",
    run: settingsSeeder,
  },
  {
    name: "agency-property-counts",
    run: agencyPropertyCountsSeeder,
  },
  {
    name: "clear-users",
    run: clearUsersSeeder,
  },
  {
    name: "free-package",
    run: freePackage,
  },
  {
    name: "cms",
    run: cmsSeeder,
  },
];

export const runSeeders = async (seederName?: string): Promise<void> => {
  try {
    if (seederName) {
      const seeder = seeders.find((s) => s.name === seederName);
      if (!seeder) {
        logger.error(`Seeder "${seederName}" not found`);
        process.exit(1);
      }
      await seeder.run();
      logger.info(`✅ Seeder "${seederName}" completed`);
    } else {
      for (const seeder of seeders) {
        logger.info(`Running seeder: "${seeder.name}"`);
        await seeder.run();
        logger.info(`✅ Seeder "${seeder.name}" completed`);
      }
      logger.info("✅ All seeders completed");
    }
  } catch (error) {
    logger.error("Error running seeders:", error);
    process.exit(1);
  }
};
