export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorDetail {
  field?: string;
  issue: string;
}

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly details?: ErrorDetail[];
  readonly isOperational = true;

  constructor(message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = ErrorCode.VALIDATION_ERROR;
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = ErrorCode.UNAUTHORIZED;
  constructor(message = "Credenciales invalidas o ausentes") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = ErrorCode.FORBIDDEN;
  constructor(message = "No tenes permisos para esta accion") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = ErrorCode.NOT_FOUND;
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = ErrorCode.CONFLICT;
}

export class BusinessRuleError extends AppError {
  readonly statusCode = 422;
  readonly code: string;
  constructor(code: string, message: string, details?: ErrorDetail[]) {
    super(message, details);
    this.code = code;
  }
}

export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly code = ErrorCode.RATE_LIMIT_EXCEEDED;
  constructor(readonly retryAfterSeconds: number) {
    super("Demasiadas solicitudes");
  }
}
