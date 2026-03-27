import { ResJson } from "@utils/response-json";
import type { NextFunction, Request, Response } from "express";
import formidable from "formidable";
import { ZodError, z } from "zod";
import { createErrorMap } from "zod-validation-error";
import { FileHelper } from "@/utils/file-helpers";

export const validateRequest =
  (schema: z.ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      z.config({
        customError: createErrorMap(),
      });

      let parsedBody = req.body;
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("multipart/form-data")) {
        parsedBody = await parseMultipart(req);
      }

      const validated = await schema.parseAsync({
        body: trimObjectStrings(parsedBody),
        query: trimObjectStrings(req.query),
        params: trimObjectStrings(req.params),
      });

      if (validated && typeof validated === "object") {
        if ("body" in validated) {
          req.body = validated.body as Record<string, unknown>;
        }

        next();
      }
    } catch (error) {
      if (!(error instanceof ZodError)) {
        throw error;
      }

      const errors: Record<string, string[]> = {};

      for (const issue of error.issues) {
        const path = issue.path.slice(1).join(".") || "root";

        const message = getMessage(issue);

        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(message);
      }

      ResJson.invalid(res, "Invalid request", errors);
    }
  };

const trimObjectStrings = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map(trimObjectStrings);
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, value]) => {
      acc[key] = trimObjectStrings(value);
      return acc;
    }, {} as object);
  }
  return value;
};

const UPPERCASE_PATTERN = /([A-Z])/g;
const FIRST_CHAR_PATTERN = /^./;
const ARRAY_BRACKET_PATTERN = /\[\d*\]/;

const prettifyField = (field: string) => field.replace(UPPERCASE_PATTERN, " $1").replace(FIRST_CHAR_PATTERN, (s) => s.toUpperCase());

const getMessage = (issue: z.ZodError["issues"][number]) => {
  if (issue.message && !issue.message.startsWith("expected")) {
    return issue.message;
  }

  const field = prettifyField(issue.path.at(-1)?.toString() || "Field");

  if (issue.code === "invalid_type" && issue.expected === "string" && issue.message.includes("undefined")) {
    return `${field} is required`;
  }

  if (issue.code === "invalid_type") {
    return `Invalid ${field}`;
  }

  return "Invalid value";
};

const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown) => {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }
};

const parseMultipart = (req: Request): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, uploadDir: FileHelper.getTempDir(), keepExtensions: false });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      const merged: Record<string, unknown> = {};

      const normalizeValue = (fieldName: string, value: unknown) => {
        if (ARRAY_BRACKET_PATTERN.test(fieldName)) {
          return Array.isArray(value) ? value : [value];
        }
        return Array.isArray(value) && value.length === 1 ? value[0] : value;
      };

      for (const fieldName in fields) {
        if (fieldName in fields) {
          const value = fields[fieldName];
          setNestedValue(merged, fieldName, normalizeValue(fieldName, value));
        }
      }

      for (const fieldName in files) {
        if (fieldName in files) {
          const file = files[fieldName] as formidable.File | formidable.File[];

          const normalizeFile = (f: formidable.File) => ({
            filepath: f.filepath,
            filename: f.originalFilename,
            size: f.size,
            mimetype: f.mimetype,
            extension: FileHelper.mimeTypeExtension[f.mimetype ?? ""] || undefined,
          });

          const fileValue = Array.isArray(file) ? file.map(normalizeFile) : normalizeFile(file);

          let processedFileValue: unknown;

          if (ARRAY_BRACKET_PATTERN.test(fieldName)) {
            processedFileValue = Array.isArray(fileValue) ? fileValue : [fileValue];
          } else {
            processedFileValue = Array.isArray(fileValue) ? fileValue[0] : fileValue;
          }

          setNestedValue(merged, fieldName, processedFileValue);
        }
      }

      resolve(merged);
    });
  });
