import express, { type Router } from "express";
import { UserAppController } from "@/controllers/app/user/UserAppController";
import { AuthMiddleware } from "@/middleware/AuthMiddleware";
import { AppUserCmsRoute } from "./main-routes/AppUserCmsRouter";
import { AppUserFavoriteRouter } from "./main-routes/AppUserFavoriteRouter";
import { AppUserAgencyRouter } from "./main-routes/UserAgencyRoute";
import { AppUserAuthRouter } from "./main-routes/UserAuthRouter";
import { AppUserEnquiryRouter } from "./main-routes/UserEnquiryRouter";
import { AppUserHomeRouter } from "./main-routes/UserHomeRoute";
import { AppUserPackageRouter } from "./main-routes/UserPackageRouter";
import { AppUserPropertiesRouter } from "./main-routes/UserPropertiesRouter";

export const AppUserRouter: Router = express.Router();

AppUserRouter.use("/auth", AppUserAuthRouter);
AppUserRouter.use("/home", AppUserHomeRouter);

AppUserRouter.use(AuthMiddleware.user);

AppUserRouter.use("/locations", UserAppController.getLocations);
AppUserRouter.use("/amenities", UserAppController.getAmenities);
AppUserRouter.use("/subcategory", UserAppController.getSubCategories);

AppUserRouter.use("/properties", AppUserPropertiesRouter);
AppUserRouter.use("/packages", AppUserPackageRouter);
AppUserRouter.use("/enquiries", AppUserEnquiryRouter);
AppUserRouter.use("/favorites", AppUserFavoriteRouter);
AppUserRouter.use("/cms", AppUserCmsRoute);

AppUserRouter.use("/agencies", AppUserAgencyRouter);
