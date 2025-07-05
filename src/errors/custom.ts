import { ErrorCodes, ErrorDetailsMap } from '@enums/error-code';

export class CustomError extends Error {
  public statusCode: number;
  public code: string;

  constructor(errorKey: ErrorCodes) {
    const { statusCode, code, message } = ErrorDetailsMap[errorKey];

    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}