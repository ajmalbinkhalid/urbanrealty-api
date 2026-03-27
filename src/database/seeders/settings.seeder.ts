import { GeneralSettingsModel } from "../models/GeneralSettingsModel";

export const settingsSeeder = async () => {
  let settings = await GeneralSettingsModel.findOne({
    deletedAt: null,
  }).lean();

  if (!settings) {
    settings = await GeneralSettingsModel.create({
      name: {
        en: "Company Name",
        ar: "اسم الشركة",
      },
      email: "info@example.com",
      phone: { phoneCode: "+91", phoneNumber: "0000000000" },
      whatsapp: { phoneCode: "+91", phoneNumber: "0000000000" },
      about: {
        en: "About company",
        ar: "حول الشركة",
      },
    });
  }
};
