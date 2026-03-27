import express, { type Router } from "express";
import { WebUserController } from "@/controllers/website/user/WebUserController";

export const WebUserPackageRouter: Router = express.Router();

WebUserPackageRouter.get("/", WebUserController.getAllPackages);
