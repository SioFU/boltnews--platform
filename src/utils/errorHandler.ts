import { toast } from 'react-hot-toast';
import { getCurrentEnv, ENV_CONFIG } from './envConfig';

// Error type enumeration
export enum ErrorType {
  // Authentication related
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // Permission related
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Resource related
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  
  // Input validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // File related
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_SUPPORTED = 'FILE_TYPE_NOT_SUPPORTED',
  
  // Network and server
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Default
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// User-friendly error messages
const errorMessages: Record<ErrorType, string> = {
  AUTH_REQUIRED: 'Please login first',
  AUTH_INVALID: 'Invalid username or password',
  AUTH_EXPIRED: 'Login session expired, please login again',
  PERMISSION_DENIED: 'You don\'t have permission to perform this action',
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  VALIDATION_ERROR: 'Invalid input data',
  FILE_TOO_LARGE: 'File size exceeds limit',
  FILE_TYPE_NOT_SUPPORTED: 'File type not supported',
  NETWORK_ERROR: 'Network connection error',
  SERVER_ERROR: 'Server error',
  UNKNOWN_ERROR: 'An unknown error occurred'
};

export interface ErrorDetails {
  type: ErrorType;
  message?: string;
  originalError?: any;
  component?: string;
}

// Enhanced error logging based on environment
const logErrorDetails = (error: ErrorDetails) => {
  const env = getCurrentEnv();
  const config = ENV_CONFIG[env];

  if (config.logToConsole) {
    console.group('Error Details');
    console.error('Error Type:', error.type);
    console.error('Error Message:', error.message);
    if (error.component) {
      console.error('Component:', error.component);
    }
    if (!config.maskSensitiveData && error.originalError) {
      console.error('Original Error:', error.originalError);
    }
    console.groupEnd();
  }
};

// Unified error handling function
export const handleError = (error: ErrorDetails) => {
  // Record error details based on environment configuration
  logErrorDetails(error);
  
  const env = getCurrentEnv();
  const config = ENV_CONFIG[env];
  
  // Display user-friendly error message
  const userMessage = config.showDetailedErrors && error.message
    ? error.message
    : errorMessages[error.type] || errorMessages.UNKNOWN_ERROR;
  
  toast.error(userMessage);
  
  // Return error type for specific handling by the caller
  return error.type;
};

// Error mapping function
export const mapError = (error: any): ErrorDetails => {
  // Supabase error mapping
  if (error?.code === 'PGRST116') {
    return {
      type: ErrorType.RESOURCE_NOT_FOUND,
      originalError: error
    };
  }

  if (error?.code === '42501') {
    return {
      type: ErrorType.PERMISSION_DENIED,
      message: 'Please login first or check if you have the required permissions',
      originalError: error
    };
  }

  if (error?.message?.includes('JWT')) {
    return {
      type: ErrorType.AUTH_EXPIRED,
      originalError: error
    };
  }
  
  // File-related error mapping
  if (error?.message?.includes('size')) {
    return {
      type: ErrorType.FILE_TOO_LARGE,
      originalError: error
    };
  }
  
  if (error?.message?.includes('type')) {
    return {
      type: ErrorType.FILE_TYPE_NOT_SUPPORTED,
      originalError: error
    };
  }
  
  // Default error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error?.message,
    originalError: error
  };
};
