import { ErrorType, ErrorHandler } from '@/types';

/**
 * Comprehensive error handling system
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly retryable: boolean;
  public readonly action: 'retry' | 'redirect' | 'ignore';

  constructor(
    message: string,
    type: ErrorType,
    retryable: boolean = false,
    action: 'retry' | 'redirect' | 'ignore' = 'ignore'
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.retryable = retryable;
    this.action = action;
  }
}

/**
 * Error handler factory
 * Creates appropriate error handlers based on error type
 */
export function createErrorHandler(error: Error | AppError): ErrorHandler {
  if (error instanceof AppError) {
    return {
      type: error.type,
      message: error.message,
      action: error.action,
      retryable: error.retryable
    };
  }

  // Handle common error patterns
  if (error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network connection failed. Please check your internet connection.',
      action: 'retry',
      retryable: true
    };
  }

  if (error.message.includes('timeout')) {
    return {
      type: ErrorType.API_TIMEOUT,
      message: 'Request timed out. Please try again.',
      action: 'retry',
      retryable: true
    };
  }

  if (error.message.includes('storage') || error.message.includes('quota')) {
    return {
      type: ErrorType.STORAGE_QUOTA_EXCEEDED,
      message: 'Browser storage is full. Please clear some data and try again.',
      action: 'ignore',
      retryable: false
    };
  }

  // Default error handler
  return {
    type: ErrorType.VALIDATION_ERROR,
    message: error.message || 'An unexpected error occurred.',
    action: 'ignore',
    retryable: false
  };
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Network error handler
 * Handles network-related errors with retry logic
 */
export async function handleNetworkError<T>(
  operation: () => Promise<T>,
  context: string = 'operation'
): Promise<T> {
  try {
    return await retryWithBackoff(operation, 3, 1000);
  } catch (error) {
    throw new AppError(
      `Network error during ${context}. Please check your connection and try again.`,
      ErrorType.NETWORK_ERROR,
      true,
      'retry'
    );
  }
}

/**
 * API error handler
 * Handles API-specific errors with appropriate user messages
 */
export function handleAPIError(error: any, context: string = 'API call'): never {
  if (error.status === 401) {
    throw new AppError(
      'API authentication failed. Please check your API key.',
      ErrorType.INVALID_RESPONSE,
      false,
      'redirect'
    );
  }

  if (error.status === 429) {
    throw new AppError(
      'API rate limit exceeded. Please wait a moment and try again.',
      ErrorType.API_TIMEOUT,
      true,
      'retry'
    );
  }

  if (error.status >= 500) {
    throw new AppError(
      `Server error during ${context}. Please try again later.`,
      ErrorType.NETWORK_ERROR,
      true,
      'retry'
    );
  }

  throw new AppError(
    `${context} failed: ${error.message || 'Unknown error'}`,
    ErrorType.INVALID_RESPONSE,
    false,
    'ignore'
  );
}

/**
 * Storage error handler
 * Handles localStorage and storage-related errors
 */
export function handleStorageError(error: Error, operation: string): never {
  if (error.message.includes('quota') || error.message.includes('storage')) {
    throw new AppError(
      'Browser storage is full. Please clear some data or use a different browser.',
      ErrorType.STORAGE_QUOTA_EXCEEDED,
      false,
      'ignore'
    );
  }

  throw new AppError(
    `Storage error during ${operation}: ${error.message}`,
    ErrorType.VALIDATION_ERROR,
    false,
    'ignore'
  );
}

/**
 * PDF generation error handler
 * Handles PDF generation and processing errors
 */
export function handlePDFError(error: Error, documentType: string): never {
  throw new AppError(
    `Failed to generate ${documentType}. Please try again or contact support.`,
    ErrorType.PDF_GENERATION_FAILED,
    true,
    'retry'
  );
}

/**
 * File upload error handler
 * Handles file upload and processing errors
 */
export function handleFileUploadError(error: Error, filename: string): never {
  if (error.message.includes('size') || error.message.includes('large')) {
    throw new AppError(
      `File "${filename}" is too large. Please use a file smaller than 10MB.`,
      ErrorType.FILE_UPLOAD_ERROR,
      false,
      'ignore'
    );
  }

  if (error.message.includes('type') || error.message.includes('format')) {
    throw new AppError(
      `File "${filename}" is not supported. Please use PDF, DOC, or DOCX files.`,
      ErrorType.FILE_UPLOAD_ERROR,
      false,
      'ignore'
    );
  }

  throw new AppError(
    `Failed to upload "${filename}". Please try again.`,
    ErrorType.FILE_UPLOAD_ERROR,
    true,
    'retry'
  );
}

/**
 * CV parsing error handler
 * Handles CV parsing and AI processing errors
 */
export function handleCVParsingError(error: Error): never {
  throw new AppError(
    'Failed to parse CV content. Please try a different file or enter your information manually.',
    ErrorType.CV_PARSING_ERROR,
    true,
    'retry'
  );
}

/**
 * Validation error handler
 * Handles form validation and input errors
 */
export function handleValidationError(field: string, message: string): never {
  throw new AppError(
    `${field}: ${message}`,
    ErrorType.VALIDATION_ERROR,
    false,
    'ignore'
  );
}

/**
 * Global error boundary handler
 * Catches unhandled errors and provides fallback UI
 */
export function handleGlobalError(error: Error, errorInfo?: any): void {
  console.error('Global error caught:', error, errorInfo);
  
  // In a real app, you'd send this to an error reporting service
  // like Sentry, LogRocket, or Bugsnag
  
  // For now, just log it
  const errorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    errorInfo
  };
  
  console.error('Error report:', errorReport);
}

/**
 * Offline detection and handling
 * Handles offline scenarios gracefully
 */
export function handleOfflineError(): never {
  throw new AppError(
    'You appear to be offline. Please check your internet connection and try again.',
    ErrorType.NETWORK_ERROR,
    true,
    'retry'
  );
}

/**
 * Loading state manager
 * Manages loading states for async operations
 */
export class LoadingStateManager {
  private loadingStates: Map<string, boolean> = new Map();
  private callbacks: Map<string, (isLoading: boolean) => void> = new Map();

  setLoading(key: string, isLoading: boolean): void {
    this.loadingStates.set(key, isLoading);
    const callback = this.callbacks.get(key);
    if (callback) {
      callback(isLoading);
    }
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  onLoadingChange(key: string, callback: (isLoading: boolean) => void): void {
    this.callbacks.set(key, callback);
  }

  clearLoading(key: string): void {
    this.loadingStates.delete(key);
    this.callbacks.delete(key);
  }
}

// Global loading state manager instance
export const loadingManager = new LoadingStateManager();

/**
 * Success message handler
 * Provides consistent success messaging
 */
export function showSuccessMessage(message: string, duration: number = 3000): void {
  // Simple browser notification (optional)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Success', {
      body: message,
      icon: '/favicon.ico'
    });
  }
}

/**
 * Progress indicator for long-running operations
 */
export class ProgressTracker {
  private progress: number = 0;
  private callbacks: ((progress: number) => void)[] = [];

  setProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(100, progress));
    this.callbacks.forEach(callback => callback(this.progress));
  }

  getProgress(): number {
    return this.progress;
  }

  onProgressChange(callback: (progress: number) => void): void {
    this.callbacks.push(callback);
  }

  reset(): void {
    this.progress = 0;
    this.callbacks.forEach(callback => callback(0));
  }
}