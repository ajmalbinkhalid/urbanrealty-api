import fs from "node:fs";
import winston, { format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${message}${metaString}`;
});

const fileFormat = format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat);

const logger = winston.createLogger({
  level: "info",
  transports: [
    new DailyRotateFile({
      dirname: logDir,
      filename: "application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
    }),

    new DailyRotateFile({
      dirname: logDir,
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      format: fileFormat,
    }),
  ],
  exitOnError: false,
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
    })
  );
}

export default logger;
