import { EnquiryModel } from "@database/models/EnquiryModel";
import { ResJson } from "@utils/response-json";
import type { Response } from "express";
import type { TDeleteEnquiryParams, TGetEnquiryParams } from "@/routes/dashboard/validations/EnquiryRouterValidation";
import type { AdminRequest } from "@/types/admin-type";
import { DBHelper } from "@/utils/db-helpers";

class EnquiryController {
  async getAllEnquiries(req: AdminRequest, res: Response): Promise<void> {
    try {
      const filters = {} as Record<string, unknown>;

      // soft delete filter
      filters.deletedAt = null;

      const result = await DBHelper.fetch({
        model: EnquiryModel,
        req,
        searchFields: ["name", "email", "phone.phoneNumber"],
        filters,
        projection: {
          enquiryId: 1,
          name: 1,
          email: 1,
          phone: 1,
          message: 1,
          createdAt: 1,
        },
      });

      return ResJson.success(res, "Enquiries fetched successfully", result);
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async getEnquiryDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetEnquiryParams;

      const enquiry = await EnquiryModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!enquiry) {
        return ResJson.notFound(res, "Enquiry not found");
      }

      return ResJson.success(res, "Enquiry fetched successfully", { enquiry });
    } catch (error) {
      return ResJson.error(res, error);
    }
  }

  async deleteEnquiry(req: AdminRequest, res: Response): Promise<void> {
    const session = await EnquiryModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TDeleteEnquiryParams;

      const enquiry = await EnquiryModel.findOne({
        _id: id,
        deletedAt: null,
      }).session(session);

      if (!enquiry) {
        await session.abortTransaction();
        return ResJson.notFound(res, "Enquiry not found");
      }

      enquiry.updatedAt = new Date();
      enquiry.updatedBy = DBHelper.actor(req);
      enquiry.deletedAt = new Date();
      enquiry.deletedBy = DBHelper.actor(req);

      await enquiry.save({ session });

      await session.commitTransaction();
      return ResJson.success(res, "Enquiry deleted successfully");
    } catch (error) {
      await session.abortTransaction();
      return ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }
}

export default new EnquiryController();
