import ConnectDB from "./../src/database/db";
import { runSeeders } from "./../src/database/seeders/index";

const seederName = process.argv[2];

const main = async () => {
  await ConnectDB();
  await runSeeders(seederName);
  process.exit(0);
};

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
