export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'The request could not be validated.', details?: unknown) {
    super(message, 'VALIDATION_ERROR', 422, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message: string = 'Authentication required.') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found.`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired.') {
    super(message, 'TOKEN_EXPIRED', 410);
  }
}

export class AccountLockedError extends AppError {
  constructor(message: string = 'Account temporarily locked due to failed attempts.') {
    super(message, 'ACCOUNT_LOCKED', 423);
  }
}

export class RateLimitedError extends AppError {
  constructor(message: string = 'Rate limit exceeded.') {
    super(message, 'RATE_LIMITED', 429);
  }
}

export class ProviderError extends AppError {
  constructor(provider: string, message: string) {
    super(`${provider} error: ${message}`, 'PROVIDER_ERROR', 502);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is currently unavailable.`, 'SERVICE_UNAVAILABLE', 503);
  }
}
