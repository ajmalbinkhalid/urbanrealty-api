import { AdminModel } from "@database/models/AdminModel";
import { StatusEnum } from "@enum/StatusEnum";
import env from "@env";
import logger from "@utils/logger";
import bcrypt from "bcrypt";

export const adminSeeder = async (): Promise<void> => {
  const adminExists = await AdminModel.findOne({ isAdmin: true }).lean();

  if (!adminExists) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(env.ADMIN_PASSWORD, salt);

    const newUser = new AdminModel({
      name: "Super Admin",
      password: hash,
      email: env.ADMIN_EMAIL,
      isAdmin: true,
      status: StatusEnum.active,
    });
    await newUser.save();
    logger.info("✅ Admin seeded successfully");
  }
};
