import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import env from "@env";
import z from "zod";
import logger from "./logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CustomFileSchema = z
  .object({
    filepath: z.string(),
    size: z.number(),
    mimetype: z.string(),
    extension: z.string(),
  })
  .brand<"CustomFile">();

export type CustomFile = z.infer<typeof CustomFileSchema>;

type FileUploadOptions = {
  folder: string;
  prefix: string;
};

type FileUploadResult = {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
};

export class FileHelperClass {
  allowedMimeTypes = {
    png: "image/png",
    jpeg: "image/jpeg",
    jpg: "image/jpg",
    webp: "image/webp",
    svg: "image/svg+xml",
  };

  mimeTypeExtension: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };

  static getRootDir(): string {
    if (env.ENV === "local") {
      return join(__dirname, "../../");
    }
    return join(__dirname, "../../../");
  }

  getTempDir(): string {
    const dir = join(FileHelperClass.getRootDir(), "uploads/temp/");

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    return dir;
  }

  static getUploadDir(folder: string): string {
    const dir = join(FileHelperClass.getRootDir(), `uploads/${folder}/`);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    return dir;
  }

  deleteFile(filePath: string): void {
    try {
      // Ensure file is within uploads directory
      const uploadsDir = join(FileHelperClass.getRootDir(), "uploads");
      const fullFilePath = join(FileHelperClass.getRootDir(), filePath);
      const resolvedPath = path.resolve(fullFilePath);
      const resolvedUploadsDir = path.resolve(uploadsDir);

      if (!resolvedPath.startsWith(resolvedUploadsDir)) {
        logger.error(`Security: Attempted to delete file outside uploads directory: ${filePath}`);
        return;
      }

      if (!existsSync(resolvedPath)) {
        logger.warn(`File not found: ${filePath}`);
        return;
      }

      unlinkSync(resolvedPath);
      logger.info(`File removed: ${filePath}`);
    } catch (error) {
      logger.error("Error removing file:", error);
    }
  }

  /**
   * Upload and process a single image file from base64 string
   * Call this function directly in controllers after receiving the base64 file
   * @param file - File object containing filepath, size, mimetype, and extension
   * @param options - Upload options including folder and prefix
   */
  uploadFile(file: CustomFile, options: FileUploadOptions): FileUploadResult {
    try {
      const { folder, prefix } = options;

      const fileName = `${prefix}-${randomUUID()}.${file.extension}`;
      const uploadDir = FileHelperClass.getUploadDir(folder);
      const fullFilePath = join(uploadDir, fileName);

      renameSync(file.filepath, fullFilePath);

      const relativePath = `uploads/${folder}/${fileName}`;

      logger.info(`File uploaded successfully: ${relativePath}`);

      return {
        success: true,
        filePath: relativePath,
        fileName,
      };
    } catch (error) {
      logger.error("Error uploading file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      };
    }
  }

  getUrl(filePath: string | undefined | null): string | undefined {
    if (!filePath) {
      return undefined;
    }
    const STORAGE_URL = env.STORAGE_URL;
    return new URL(filePath, STORAGE_URL).toString();
  }
}

export const FileHelper = new FileHelperClass();
