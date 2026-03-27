import logger from "@utils/logger";
import env from "env";
import mongoose from "mongoose";

const ConnectDB = async (): Promise<void> => {
  try {
    const mongoUri = env.MONGO_CONNECTION_STRING;
    if (!mongoUri) {
      throw new Error("MONGO_CONNECTION_STRING environment variable is not set");
    }

    await mongoose.connect(mongoUri);
    logger.info("Mongodb connected successfully.");
  } catch (err) {
    logger.error("Database connection error:", err);
    throw err;
  }
};

mongoose.connection.on("disconnected", () => {
  logger.info("MongoDB disconnected!");
});

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connected!");
});

export default ConnectDB;
