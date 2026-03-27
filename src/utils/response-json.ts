import type { Response } from "express";
import { UnauthenticatedError, ValidationError } from "./custom-errors";
import logger from "./logger";
import { ResponseStatusCode, type TResponseStatusCode } from "./status-code";

export type ApiResponse<T = object> = {
  success: boolean;
  message: string;
  data?: T;
};

class ResJsonClass {
  /**
   * Send an error response
   */
  private customError(res: Response, message: string, statusCode: TResponseStatusCode = ResponseStatusCode.serverError, errors?: object): void {
    res.status(statusCode).json({
      success: false,
      status: statusCode,
      message,
      errors,
    } as ApiResponse);
  }
  /**
   * Send a successful response
   */
  success<T>(res: Response, message: string, data?: T, statusCode: TResponseStatusCode = ResponseStatusCode.success): void {
    res.status(statusCode).json({
      success: true,
      status: statusCode,
      message,
      data,
    } as ApiResponse<T>);
  }

  /**
   * Send an invalid request response (422)
   */
  invalid(res: Response, message: string, errors?: object): void {
    this.customError(res, message, ResponseStatusCode.validationError, errors);
  }

  /**
   * Send a bad request response (400)
   */
  badRequest(res: Response, message: string, errors?: object): void {
    this.customError(res, message, ResponseStatusCode.badRequest, errors);
  }

  /**
   * Send an unauthenticated response (401)
   */
  unauthenticated(res: Response, message = "Unauthorized access"): void {
    this.customError(res, message, ResponseStatusCode.unauthorized);
  }

  /**
   * Send a not found response (404)
   */
  notFound(res: Response, message = "Resource not found"): void {
    this.customError(res, message, ResponseStatusCode.notFound);
  }

  error(res: Response, error: Error, message?: string): void {
    logger.error(`${typeof error} Error:`, error);
    let errorMessage: string | undefined = message;
    let statusCode: TResponseStatusCode = ResponseStatusCode.serverError;

    if (error.message.includes("request entity too large")) {
      statusCode = ResponseStatusCode.validationError;
      errorMessage = "Payload too large";
    }

    if (error instanceof UnauthenticatedError) {
      statusCode = ResponseStatusCode.validationError;
      errorMessage = error.message;
    }
    if (error instanceof ValidationError) {
      statusCode = error.code as TResponseStatusCode;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage ?? "Internal Server Error",
    });
  }
}

export const ResJson = new ResJsonClass();
