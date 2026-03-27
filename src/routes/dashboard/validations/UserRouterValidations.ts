import { ZodHelpers } from "@utils/zod-helpers";
import { z } from "zod";

export const UserValidation = {
  getAllUsers: z.object({
    query: ZodHelpers.tablePagination().optional(),
  }),
  getUserDetails: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  updateUser: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters").trim(),
      lastName: z.string().min(2, "Last name must be at least 2 characters").trim(),
    }),
  }),
  toggleStatus: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
  deleteUser: z.object({
    params: z.object({
      id: ZodHelpers.mongoId,
    }),
  }),
};

// Type exports for type-safe request handling
export type TGetUsersListQuery = z.infer<typeof UserValidation.getAllUsers>["query"];
export type TGetUserDetailsParams = z.infer<typeof UserValidation.getUserDetails>["params"];
export type TUpdateUserParams = z.infer<typeof UserValidation.updateUser>["params"];
export type TUpdateUserRequest = z.infer<typeof UserValidation.updateUser>["body"];
export type TToggleStatusParams = z.infer<typeof UserValidation.toggleStatus>["params"];
export type TDeleteUserParams = z.infer<typeof UserValidation.deleteUser>["params"];
