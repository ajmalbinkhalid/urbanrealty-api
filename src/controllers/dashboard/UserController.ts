import { type TUserModel, UserModel } from "@database/models/UserModel";
import { StatusEnum } from "@enum/StatusEnum";
import { DBHelper } from "@utils/db-helpers";
import { ResJson } from "@utils/response-json";
import type { Response } from "express";
import type { TDeleteUserParams, TGetUserDetailsParams, TToggleStatusParams, TUpdateUserParams, TUpdateUserRequest } from "@/routes/dashboard/validations/UserRouterValidations";
import type { AdminRequest } from "@/types/admin-type";

class UserControllerClass {
  static getUser(user: TUserModel): Record<string, unknown> {
    return {
      _id: user._id.toString(),
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      // phone: {
      //   phoneCode: user.phone.phoneCode,
      //   phoneNumber: user.phone.phoneNumber,
      // },
      status: user.status,
      createdAt: user.createdAt,
      createdBy: user.createdBy,
      updatedAt: user.updatedAt,
    };
  }

  async getAllUsers(req: AdminRequest, res: Response): Promise<void> {
    try {
      const result = await DBHelper.fetch({
        model: UserModel,
        req,
        searchFields: ["firstName", "lastName", "email", "phone.phoneNumber", "userId"],

        projection: {
          _id: 1,
          userId: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          // phone: {
          //   phoneCode: 1,
          //   phoneNumber: 1,
          // },
          status: 1,
          createdAt: 1,
          createdBy: 1,
        },
      });

      ResJson.success(res, "Users list fetched", result);
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async getUserDetails(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TGetUserDetailsParams;

      const user = await UserModel.findOne({
        _id: id,
        deletedAt: null,
      }).lean();

      if (!user) {
        ResJson.notFound(res, "User not found");
        return;
      }

      ResJson.success(res, "User fetched successfully", {
        user: UserControllerClass.getUser(user),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async updateUser(req: AdminRequest, res: Response): Promise<void> {
    const session = await UserModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TUpdateUserParams;
      const { firstName, lastName } = req.body as TUpdateUserRequest;

      const user = await UserModel.findOne({
        _id: id,
        deletedAt: null,
      }).session(session);

      if (!user) {
        await session.abortTransaction();
        ResJson.notFound(res, "User not found");
        return;
      }

      user.firstName = firstName;
      user.lastName = lastName;
      user.updatedAt = new Date();
      user.updatedBy = DBHelper.actor(req);

      await user.save({ session });

      await session.commitTransaction();

      ResJson.success(res, "User updated successfully", {
        user: UserControllerClass.getUser(user),
      });
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }

  async toggleStatus(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params as TToggleStatusParams;

      const user = await UserModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!user) {
        ResJson.notFound(res, "User not found");
        return;
      }

      user.status = user.status === StatusEnum.active ? StatusEnum.inactive : StatusEnum.active;
      user.updatedAt = new Date();
      user.updatedBy = DBHelper.actor(req);

      await user.save();

      ResJson.success(res, `User ${user.status === StatusEnum.active ? "activated" : "deactivated"} successfully`, {
        user: UserControllerClass.getUser(user),
      });
    } catch (error) {
      ResJson.error(res, error);
    }
  }

  async deleteUser(req: AdminRequest, res: Response): Promise<void> {
    const session = await UserModel.startSession();
    session.startTransaction();

    try {
      const { id } = req.params as TDeleteUserParams;

      const user = await UserModel.findOne({
        _id: id,
        deletedAt: null,
      }).session(session);

      // TODO; Check for any dependencies before deleting the user - properties, packages, etc.

      if (!user) {
        await session.abortTransaction();
        ResJson.notFound(res, "User not found");
        return;
      }

      user.deletedAt = new Date();
      user.deletedBy = DBHelper.actor(req);
      user.updatedAt = new Date();
      user.updatedBy = DBHelper.actor(req);

      await user.save({ session });

      await session.commitTransaction();

      ResJson.success(res, "User deleted successfully");
    } catch (error) {
      await session.abortTransaction();
      ResJson.error(res, error);
    } finally {
      session.endSession();
    }
  }
}

export const UserController = new UserControllerClass();
