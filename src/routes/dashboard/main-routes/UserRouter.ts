import express, { type Router } from "express";
import { UserController } from "@/controllers/dashboard/UserController";
import { validateRequest } from "@/middleware/ValidationMiddleware";
import { UserValidation } from "../validations/UserRouterValidations";

export const UserRouter: Router = express.Router();

UserRouter.get("/", validateRequest(UserValidation.getAllUsers), UserController.getAllUsers);
UserRouter.get("/:id", validateRequest(UserValidation.getUserDetails), UserController.getUserDetails);
UserRouter.put("/:id", validateRequest(UserValidation.updateUser), UserController.updateUser);
UserRouter.patch("/:id/status", validateRequest(UserValidation.toggleStatus), UserController.toggleStatus);
UserRouter.delete("/:id", validateRequest(UserValidation.deleteUser), UserController.deleteUser);
