import express, { type Router } from "express";
import { HomePageController } from "@/controllers/dashboard/HomePageController";

export const HomeRouter: Router = express.Router();

HomeRouter.get("/stats", HomePageController.getStats);
