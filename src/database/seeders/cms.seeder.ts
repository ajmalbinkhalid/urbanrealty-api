import { CmsModel } from "@database/models/CmsModel";
import logger from "@utils/logger";

type CmsSeedStats = {
  created: boolean;
};

export const cmsSeeder = async (): Promise<void> => {
  try {
    const stats: CmsSeedStats = {
      created: false,
    };

    logger.info("Seeding CMS pages...");

    const result = await CmsModel.updateOne(
      {},
      {
        $setOnInsert: {
          privacyPolicy: {
            pageId: "PG-1001",
            pageTitle: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
            description: { en: "We respect your privacy and protect your data.", ar: "سياسة الخصوصية" },
          },

          termsAndConditions: {
            pageId: "PG-1002",
            pageTitle: { en: "Terms & Conditions", ar: "سياسة الخصوصية" },
            description: { en: "By using this service, you agree to our terms.", ar: "سياسة الخصوصية" },
          },

          faq: {
            pageId: "PG-1003",
            pageTitle: { en: "FAQ", ar: "سياسة الخصوصية" },
            description: { en: "Frequently asked questions.", ar: "سياسة الخصوصية" },
          },
          howItWorks: {
            pageId: "PG-1004",
            pageTitle: { en: "HowItWorks", ar: "ياسة الخصوصي" },
            image: "uploads/cms/mobileIntroduction/mobileIntroduction-851de1bf-aa71-425c-a613-dbbe13c06891.jpeg",

            title1: {
              title: { en: "Choose Property", ar: "الخصوصي" },
              icon: "uploads/cms/mobileIntroduction/mobileIntroduction-3d3fc7ff-7e85-43b7-8092-9a7ea8d2fd3a.jpeg",
            },
            title2: {
              title: { en: "get to know how it works", ar: "الخصوصي" },
              icon: "uploads/cms/mobileIntroduction/mobileIntroduction-3d3fc7ff-7e85-43b7-8092-9a7ea8d2fd3a.jpeg",
            },
            title3: {
              title: { en: "Contact Agent", ar: "الخصوصي" },
              icon: "uploads/cms/mobileIntroduction/mobileIntroduction-e74514cc-9748-4dcd-a683-c35fe4a01a60.jpeg",
            },
            title4: {
              title: { en: "Finalize Deal", ar: "الخصوصي" },
              icon: "uploads/cms/mobileIntroduction/mobileIntroduction-3d3fc7ff-7e85-43b7-8092-9a7ea8d2fd3a.jpeg",
            },
          },
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      stats.created = true;
      logger.info("CMS document created");
    } else {
      logger.info("CMS document already exists, skipping creation");
    }

    logger.info("CMS seeding completed");
    logger.info(`   Created: ${stats.created}`);
  } catch (error) {
    logger.error("Error seeding CMS:", error);
    throw error;
  }
};
