import type { Response } from "express";
import { CmsModel, type TCmsModel } from "@/database/models/CmsModel";
import { CmsTypeEnum } from "@/enum/CmsTypeEnum";
import type { TUpdateCms } from "@/routes/dashboard/validations/CmsRouterValidation";
import type { AdminRequest } from "@/types/admin-type";
import { FileHelper } from "@/utils/file-helpers";
import { ResJson } from "@/utils/response-json";

type CmsSection = TCmsModel["privacyPolicy"] | TCmsModel["termsAndConditions"] | TCmsModel["faq"] | TCmsModel["howItWorks"];

class CmsControllerClass {
  async getAllCmsData(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query as { type?: string };
      const cms = await CmsModel.findOne({ deletedAt: null }).lean();
      let section: CmsSection | undefined;
      let sectionName = "";

      if (!cms) {
        return ResJson.notFound(res, " cms  not found");
      }
      switch (Number(type)) {
        case CmsTypeEnum.Privacy_Policy:
          section = cms.privacyPolicy;
          sectionName = "Privacy Policy";
          break;

        case CmsTypeEnum.Terms_And_Conditions:
          section = cms.termsAndConditions;
          sectionName = "Terms & Conditions";
          break;

        case CmsTypeEnum.faq:
          section = cms.faq;
          sectionName = "FAQ";

          break;

        case CmsTypeEnum.How_It_Works:
          section = cms.howItWorks;
          sectionName = "How It Works";

          break;

        default:
          return ResJson.invalid(res, "Invalid CMS type");
      }

      ResJson.success(res, `${sectionName} fetched successfully`, section);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async updateCms(req: AdminRequest, res: Response): Promise<void> {
    try {
      const cms = await CmsModel.findOne({ deletedAt: null });
      if (!cms) {
        return ResJson.notFound(res, "CMS not found");
      }

      const body = req.body as TUpdateCms;

      switch (body.type) {
        case CmsTypeEnum.Privacy_Policy:
          if (body.privacyPolicy) {
            if (body.privacyPolicy && cms.privacyPolicy) {
              cms.privacyPolicy.pageTitle = body.privacyPolicy.pageTitle;
              cms.privacyPolicy.description = body.privacyPolicy.description;
            }
          } else {
            return ResJson.invalid(res, "privacyPolicy data missing");
          }
          break;
        case CmsTypeEnum.Terms_And_Conditions:
          if (body.termsAndConditions) {
            if (body.termsAndConditions.pageTitle && cms.termsAndConditions) {
              cms.termsAndConditions.pageTitle = body.termsAndConditions.pageTitle;
              cms.termsAndConditions.description = body.termsAndConditions.description;
            }
          } else {
            return ResJson.invalid(res, "terms and condition data missing");
          }
          break;

        case CmsTypeEnum.faq:
          if (body.faq) {
            if (body.faq.pageTitle && cms.faq) {
              cms.faq.pageTitle = body.faq.pageTitle;
              cms.faq.description = body.faq.description;
            }
          } else {
            return ResJson.invalid(res, "faq data missing");
          }
          break;

        case CmsTypeEnum.How_It_Works:
          if (body.howItWorks) {
            cms.howItWorks = {
              pageTitle: body.howItWorks?.pageTitle,
              title1: {
                title: body.howItWorks.title1?.title,
              },
              title2: {
                title: body.howItWorks.title2?.title,
              },
              title3: {
                title: body.howItWorks.title3?.title,
              },
              title4: {
                title: body.howItWorks.title4.title,
              },
            };
          }

          if (body.howItWorks?.image) {
            const upload = FileHelper.uploadFile(body.howItWorks.image, {
              folder: "cms/how-it-works",
              prefix: "how-it-works",
            });
            FileHelper.deleteFile(cms.howItWorks?.image ?? "");
            cms.howItWorks.image = upload.filePath;
          }
          if (body.howItWorks?.title1?.icon) {
            const upload = FileHelper.uploadFile(body.howItWorks.title1.icon, {
              folder: "cms/how-it-works",
              prefix: "how-it-works",
            });

            FileHelper.deleteFile(cms.howItWorks?.title1?.icon ?? "");
            cms.howItWorks.title1.icon = upload.filePath;
          }

          if (body.howItWorks?.title2?.icon) {
            const upload = FileHelper.uploadFile(body.howItWorks.title2.icon, {
              folder: "cms/how-it-works",
              prefix: "how-it-works",
            });

            FileHelper.deleteFile(cms.howItWorks?.title2?.icon ?? "");
            cms.howItWorks.title2.icon = upload.filePath;
          }
          if (body.howItWorks?.title3.icon) {
            const upload = FileHelper.uploadFile(body.howItWorks.title3.icon, {
              folder: "cms/how-it-works",
              prefix: "how-it-works",
            });
            FileHelper.deleteFile(cms.howItWorks?.title3?.icon ?? "");
            cms.howItWorks.title3.icon = upload.filePath;
          }
          if (body.howItWorks?.title4?.icon) {
            const upload = FileHelper.uploadFile(body.howItWorks.title4.icon, {
              folder: "cms/how-it-works",
              prefix: "how-it-works",
            });
            FileHelper.deleteFile(cms.howItWorks?.title4?.icon ?? "");
            cms.howItWorks.title4.icon = upload.filePath;
          }
          break;

        default:
          return ResJson.invalid(res, "Invalid type");
      }

      await cms.save();
      return ResJson.success(res, "CMS updated successfully", cms);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const CmsController = new CmsControllerClass();
