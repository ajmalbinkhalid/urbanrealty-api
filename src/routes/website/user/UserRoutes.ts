import express, { type Router } from "express";
import { WebUserController } from "@/controllers/website/user/WebUserController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { WebUserAgencyRouter } from "./main-routes/UserAgencyRoute";
import { WebUserAuthRouter } from "./main-routes/UserAuthRouter";
import { WebUserCmsRoute } from "./main-routes/UserCmsRoute";
import { WebUserEnquiryRouter } from "./main-routes/UserEnquiryRouter";
import { WebUserFavoriteRouter } from "./main-routes/UserFavoriteRouter";
import { WebUserHomeRouter } from "./main-routes/UserHomeRoute";
import { WebUserPackageRouter } from "./main-routes/UserPackageRouter";
import { WebUserPropertiesRouter } from "./main-routes/UserPropertyRouter";

export const WebUserRouter: Router = express.Router();

WebUserRouter.use("/auth", WebUserAuthRouter);
WebUserRouter.use("/home", WebUserHomeRouter);

WebUserRouter.use(AuthMiddleware.user);

WebUserRouter.get("/locations", WebUserController.getLocations);
WebUserRouter.get("/amenities", WebUserController.getAmenities);
WebUserRouter.get("/sub-categories", WebUserController.getSubCategories);

WebUserRouter.use("/properties", WebUserPropertiesRouter);
WebUserRouter.use("/packages", WebUserPackageRouter);
WebUserRouter.use("/enquiries", WebUserEnquiryRouter);
WebUserRouter.use("/favorites", WebUserFavoriteRouter);
WebUserRouter.use("/agencies", WebUserAgencyRouter);
WebUserRouter.use("/cms", WebUserCmsRoute);
