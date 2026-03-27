import type { Request, Response } from "express";
import { GeneralSettingsModel } from "@/database/models/GeneralSettingsModel";
import type { TUpdateGeneralSettings } from "@/routes/dashboard/validations/GeneralSettingsValidation";
import type { AdminRequest } from "@/types/admin-type";
import { DBHelper } from "@/utils/db-helpers";
import { FileHelper } from "@/utils/file-helpers";
import { ResJson } from "@/utils/response-json";

class GeneralSettingsControllerClass {
  async getGeneralSettings(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await GeneralSettingsModel.findOne({
        deletedAt: null,
      }).lean();

      if (!settings) {
        return ResJson.notFound(res, "General settings not found");
      }

      const filteredSettings = {
        _id: settings._id,
        name: settings.name,
        email: settings.email,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        about: settings.about,
        logo: FileHelper.getUrl(settings.logo),
        status: settings.status,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      };

      ResJson.success(res, "Settings fetched successfully", {
        settings: filteredSettings,
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }
  async updateGeneralSettings(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { name, email, phone, whatsapp, about, logo } = req.body as TUpdateGeneralSettings;

      const settings = await GeneralSettingsModel.findOne({
        deletedAt: null,
      });

      if (!settings) {
        return ResJson.notFound(res, "General settings not found");
      }

      if (logo) {
        const uploadLogo = FileHelper.uploadFile(logo, {
          folder: "general-settings",
          prefix: "logo",
        });

        if (!uploadLogo.success) {
          return ResJson.invalid(res, uploadLogo.error || "Failed to upload logo");
        }

        settings.logo = uploadLogo.filePath;
      }

      if (name !== undefined) {
        settings.name = name;
      }

      if (email !== undefined) {
        settings.email = email;
      }

      if (phone !== undefined) {
        settings.phone = phone;
      }

      if (whatsapp !== undefined) {
        settings.whatsapp = whatsapp;
      }

      if (about !== undefined) {
        settings.about = about;
      }

      settings.updatedBy = DBHelper.actor(req);

      await settings.save();

      return ResJson.success(res, "General settings updated successfully", {
        settings,
      });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }
}

export const GeneralSettingsController = new GeneralSettingsControllerClass();
