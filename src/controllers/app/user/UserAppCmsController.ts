import type { Response } from "express";
import { CmsModel } from "@/database/models/CmsModel";
import type { UserRequest } from "@/types/user-type";
import { FileHelper } from "@/utils/file-helpers";
import { ReqHelpers } from "@/utils/req-helper";
import { ResJson } from "@/utils/response-json";

class AppUserCmsControllerClass {
  async getPrivacyPolicy(req: UserRequest, res: Response): Promise<void> {
    try {
      const cms = await CmsModel.findOne({ deletedAt: null }).lean();
      if (!cms?.privacyPolicy) {
        return ResJson.notFound(res, "Privacy Policy not found");
      }

      const data = {
        pageId: cms.privacyPolicy.pageId,
        pageTitle: cms.privacyPolicy.pageTitle[ReqHelpers.locale(req)],
        description: cms.privacyPolicy.description[ReqHelpers.locale(req)],
      };

      return ResJson.success(res, "Privacy Policy fetched successfully", data);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
  async getTermsAndConditions(req: UserRequest, res: Response): Promise<void> {
    try {
      const cms = await CmsModel.findOne({ deletedAt: null }).lean();
      if (!cms?.termsAndConditions) {
        return ResJson.notFound(res, "Terms & Conditions not found");
      }

      const data = {
        pageId: cms.termsAndConditions.pageId,
        pageTitle: cms.termsAndConditions.pageTitle[ReqHelpers.locale(req)],
        description: cms.termsAndConditions.description[ReqHelpers.locale(req)],
      };
      return ResJson.success(res, "Terms & Conditions fetched successfully", data);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
  async getFaq(req: UserRequest, res: Response): Promise<void> {
    try {
      const cms = await CmsModel.findOne({ deletedAt: null }).lean();
      if (!cms?.faq) {
        return ResJson.notFound(res, "FAQ not found");
      }

      const data = {
        pageId: cms.faq.pageId,
        pageTitle: cms.faq.pageTitle[ReqHelpers.locale(req)],
        description: cms.faq.description[ReqHelpers.locale(req)],
      };

      return ResJson.success(res, "FAQ fetched successfully", data);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getHowItWorks(req: UserRequest, res: Response): Promise<void> {
    try {
      const cms = await CmsModel.findOne({ deletedAt: null }).lean();
      if (!cms?.howItWorks) {
        return ResJson.notFound(res, "How It Works not found");
      }

      const data = {
        pageId: cms.howItWorks.pageId,
        pageTitle: cms.howItWorks.pageTitle[ReqHelpers.locale(req)],
        image: FileHelper.getUrl(cms.howItWorks.image),
        title1: {
          title: cms.howItWorks?.title1?.title[ReqHelpers.locale(req)],
          icon: FileHelper.getUrl(cms.howItWorks?.title1?.icon),
        },
        title2: {
          title: cms.howItWorks?.title2?.title[ReqHelpers.locale(req)],
          icon: FileHelper.getUrl(cms.howItWorks?.title2?.icon),
        },
        title3: {
          title: cms.howItWorks?.title3?.title[ReqHelpers.locale(req)],
          icon: FileHelper.getUrl(cms.howItWorks?.title3?.icon),
        },
        title4: {
          title: cms.howItWorks?.title4?.title[ReqHelpers.locale(req)],
          icon: FileHelper.getUrl(cms.howItWorks?.title4?.icon),
        },
      };

      return ResJson.success(res, "How It Works fetched successfully", data);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const AppUserCmsController = new AppUserCmsControllerClass();
