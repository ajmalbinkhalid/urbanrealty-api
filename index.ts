import { cwd } from "node:process";
import expressMongoSanitize from "@exortek/express-mongo-sanitize";
import logger from "@utils/logger";
import cors from "cors";
import express from "express";
import ConnectDB from "@/database/db";
import { ResJson } from "@/utils/response-json";
import env from "./env";
import { AppRouter } from "./src/routes/app/AppRoutes";
import { DashboardRouter } from "./src/routes/dashboard/DashboardRoutes";
import { WebsiteRouter } from "./src/routes/website/WebsiteRoutes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(
  expressMongoSanitize({
    patterns: [/^\$/, /\./],
  })
);
app.use("/uploads", express.static(`${cwd()}/uploads`, { maxAge: 31_557_600 }));

app.use("/api/admin", DashboardRouter);
app.use("/api/web", WebsiteRouter);
app.use("/api/app", AppRouter);

app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  return ResJson.error(res, err, "Internal Server Error");
});

const { PORT } = env;

app.listen(PORT, async () => {
  logger.info(`Server listening on port ${PORT}`);
  await ConnectDB();
});
