import { ResponseStatusCode } from "./status-code";

export class ValidationError extends Error {
  code: number;

  constructor(message: string, code = ResponseStatusCode.validationError) {
    super(message);
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthenticatedError extends Error {
  code: number;

  constructor(message: string, code = ResponseStatusCode.unauthorized) {
    super(message);
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
