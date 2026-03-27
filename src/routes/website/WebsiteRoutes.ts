import express, { type Router } from "express";
import { WebAgencyRouter } from "./agency/AgencyRoute";
import { WebUserRouter } from "./user/UserRoutes";

export const WebsiteRouter: Router = express.Router();

WebsiteRouter.use("/agency", WebAgencyRouter);
WebsiteRouter.use("/user", WebUserRouter);
