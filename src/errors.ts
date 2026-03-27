/**
 * RenderingVideo Node.js SDK - Error Classes
 */

export class RenderingVideoError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'RenderingVideoError';
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class InvalidApiKeyError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'INVALID_API_KEY', details);
    this.name = 'InvalidApiKeyError';
  }
}

export class InsufficientCreditsError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'INSUFFICIENT_CREDITS', details);
    this.name = 'InsufficientCreditsError';
  }
}

export class ValidationError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'RATE_LIMITED', details);
    this.name = 'RateLimitError';
  }
}

export class AlreadyRenderingError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'ALREADY_RENDERING', details);
    this.name = 'AlreadyRenderingError';
  }
}

export class UploadError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'UPLOAD_FAILED', details);
    this.name = 'UploadError';
  }
}

export class StorageLimitError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'STORAGE_LIMIT_EXCEEDED', details);
    this.name = 'StorageLimitError';
  }
}

export class RemoteError extends RenderingVideoError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'REMOTE_ERROR', details);
    this.name = 'RemoteError';
  }
}

/**
 * Map API error codes to appropriate error types
 */
export function handleApiError(
  statusCode: number,
  message: string,
  code: string,
  details: Record<string, unknown> = {}
): RenderingVideoError {
  // First check by error code
  switch (code) {
    case 'MISSING_API_KEY':
    case 'INVALID_API_KEY':
    case 'INVALID_API_KEY_FORMAT':
    case 'API_KEY_INACTIVE':
    case 'USER_NOT_FOUND':
      return new AuthenticationError(message, { ...details, code, statusCode });

    case 'INSUFFICIENT_CREDITS':
      return new InsufficientCreditsError(message, { ...details, code, statusCode });

    case 'INVALID_REQUEST':
    case 'INVALID_CONFIG':
    case 'NO_FILES':
    case 'UNSUPPORTED_FILE_TYPE':
      return new ValidationError(message, { ...details, code, statusCode });

    case 'NOT_FOUND':
      return new NotFoundError(message, { ...details, code, statusCode });

    case 'ALREADY_RENDERING':
      return new AlreadyRenderingError(message, { ...details, code, statusCode });

    case 'STORAGE_LIMIT_EXCEEDED':
      return new StorageLimitError(message, { ...details, code, statusCode });

    case 'UPLOAD_FAILED':
      return new UploadError(message, { ...details, code, statusCode });

    case 'REMOTE_ERROR':
    case 'RENDER_TRIGGER_FAILED':
      return new RemoteError(message, { ...details, code, statusCode });
  }

  // Fallback to status code mapping
  switch (statusCode) {
    case 401:
      return new AuthenticationError(message, { ...details, code, statusCode });
    case 402:
      return new InsufficientCreditsError(message, { ...details, code, statusCode });
    case 400:
      return new ValidationError(message, { ...details, code, statusCode });
    case 404:
      return new NotFoundError(message, { ...details, code, statusCode });
    case 429:
      return new RateLimitError(message, { ...details, code, statusCode });
    default:
      return new RenderingVideoError(message, code, { ...details, statusCode });
  }
}

/**
 * @deprecated Use handleApiError instead
 */
export function createErrorFromResponse(
  statusCode: number,
  error: string,
  code: string,
  details: Record<string, unknown> = {}
): RenderingVideoError {
  return handleApiError(statusCode, error, code, details);
}
