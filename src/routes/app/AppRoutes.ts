import express, { type Router } from "express";
import { AppAgencyRouter } from "./agency/AgencyRoute";
import { AppUserRouter } from "./user/UserRoutes";

export const AppRouter: Router = express.Router();

AppRouter.use("/user", AppUserRouter);
AppRouter.use("/agency", AppAgencyRouter);
