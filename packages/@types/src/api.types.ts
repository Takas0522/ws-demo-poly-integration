/**
 * Common API request and response type definitions
 */

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if not successful */
  error?: string;
  /** Error code for client handling */
  errorCode?: string;
  /** Additional error details */
  errorDetails?: unknown;
  /** Response metadata */
  meta?: APIResponseMeta;
}

/**
 * API response metadata
 */
export interface APIResponseMeta {
  /** Request ID for tracking */
  requestId?: string;
  /** Timestamp of the response */
  timestamp?: string;
  /** API version */
  version?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Paginated API response
 */
export interface PaginatedAPIResponse<T = unknown> extends APIResponse<T[]> {
  /** Pagination information */
  pagination: PaginationInfo;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrevious: boolean;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  /** Page number (1-based, default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  pageSize?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter query parameters
 */
export interface FilterParams {
  /** Search query string */
  search?: string;
  /** Filter by status */
  status?: string;
  /** Filter by date range (start) */
  dateFrom?: string;
  /** Filter by date range (end) */
  dateTo?: string;
  /** Additional filters */
  [key: string]: string | string[] | number | boolean | undefined;
}

/**
 * Common query parameters
 */
export interface QueryParams extends PaginationParams, FilterParams {}

/**
 * API error response
 */
export interface APIErrorResponse {
  /** Error flag (always true) */
  error: true;
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  statusCode: number;
  /** Error details */
  details?: unknown;
  /** Validation errors */
  validationErrors?: ValidationError[];
  /** Stack trace (only in development) */
  stack?: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Validation rule that failed */
  rule?: string;
  /** Actual value that failed validation */
  value?: unknown;
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T = unknown> {
  /** Items to operate on */
  items: T[];
  /** Operation to perform */
  operation: 'create' | 'update' | 'delete';
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse<T = unknown> {
  /** Successfully processed items */
  succeeded: T[];
  /** Failed items with errors */
  failed: BulkOperationError<T>[];
  /** Total items processed */
  totalProcessed: number;
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failureCount: number;
}

/**
 * Bulk operation error
 */
export interface BulkOperationError<T = unknown> {
  /** Item that failed */
  item: T;
  /** Error message */
  error: string;
  /** Error code */
  errorCode?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Service status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Service name */
  service: string;
  /** Service version */
  version: string;
  /** Timestamp */
  timestamp: string;
  /** Uptime in seconds */
  uptime: number;
  /** Dependencies health status */
  dependencies?: Record<string, {
    status: 'healthy' | 'unhealthy';
    message?: string;
  }>;
}
