import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  type: 'validation' | 'authentication' | 'network' | 'server' | 'unknown';
}

/**
 * Get appropriate toast styling based on current theme
 */
const getToastStyles = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  return {
    success: {
      style: {
        background: isDarkMode ? '#065F46' : '#D1FAE5',
        color: isDarkMode ? '#D1FAE5' : '#065F46',
        border: isDarkMode ? '1px solid #10B981' : '1px solid #6EE7B7',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#10B981',
        secondary: isDarkMode ? '#065F46' : '#FFFFFF',
      },
    },
    error: {
      style: {
        background: isDarkMode ? '#7F1D1D' : '#FEE2E2',
        color: isDarkMode ? '#FEE2E2' : '#991B1B',
        border: isDarkMode ? '1px solid #DC2626' : '1px solid #FCA5A5',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#DC2626',
        secondary: isDarkMode ? '#7F1D1D' : '#FFFFFF',
      },
    },
    info: {
      style: {
        background: isDarkMode ? '#1E3A8A' : '#DBEAFE',
        color: isDarkMode ? '#DBEAFE' : '#1E40AF',
        border: isDarkMode ? '1px solid #3B82F6' : '1px solid #93C5FD',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    },
    warning: {
      style: {
        background: isDarkMode ? '#78350F' : '#FEF3C7',
        color: isDarkMode ? '#FEF3C7' : '#92400E',
        border: isDarkMode ? '1px solid #F59E0B' : '1px solid #FCD34D',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    },
  };
};

/**
 * Centralized error handler for API requests
 * Provides user-friendly error messages and proper categorization
 */
export const handleApiError = (error: unknown): ApiError => {
  // Network error (no response from server)
  if (error instanceof Error && !('response' in error)) {
    return {
      message: 'Unable to connect to server. Please check your internet connection and try again.',
      type: 'network',
    };
  }

  // Axios error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<any>;
    
    if (!axiosError.response) {
      return {
        message: 'Unable to connect to server. Please try again later.',
        type: 'network',
      };
    }

    const { status, data } = axiosError.response;
    const statusCode = status;

    // Handle specific status codes
    switch (statusCode) {
      case 400:
        return {
          message: data?.message || data?.error || 'Invalid request. Please check your input.',
          statusCode,
          type: 'validation',
        };

      case 401:
        return {
          message: data?.message || data?.error || 'Invalid email or password',
          statusCode,
          type: 'authentication',
        };

      case 403:
        return {
          message: data?.message || data?.error || 'Access denied. You do not have permission.',
          statusCode,
          type: 'authentication',
        };

      case 404:
        return {
          message: data?.message || data?.error || 'Resource not found',
          statusCode,
          type: 'validation',
        };

      case 422:
        return {
          message: data?.message || data?.error || 'Validation failed. Please check your input.',
          statusCode,
          type: 'validation',
        };

      case 429:
        return {
          message: data?.message || 'Too many requests. Please wait a moment and try again.',
          statusCode,
          type: 'validation',
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: data?.message || 'Server error. Please try again later.',
          statusCode,
          type: 'server',
        };

      default:
        return {
          message: data?.message || data?.error || 'Something went wrong. Please try again.',
          statusCode,
          type: 'unknown',
        };
    }
  }

  // Generic error
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'unknown',
  };
};

/**
 * Show error toast with proper styling based on error type
 */
export const showErrorToast = (error: unknown, customMessage?: string) => {
  const apiError = handleApiError(error);
  const message = customMessage || apiError.message;
  const styles = getToastStyles();

  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    ...styles.error,
  });

  return apiError;
};

/**
 * Show success toast with consistent styling
 */
export const showSuccessToast = (message: string) => {
  const styles = getToastStyles();
  
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    ...styles.success,
  });
};

/**
 * Show info toast with consistent styling
 */
export const showInfoToast = (message: string) => {
  const styles = getToastStyles();
  
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    ...styles.info,
  });
};

/**
 * Show warning toast with consistent styling
 */
export const showWarningToast = (message: string) => {
  const styles = getToastStyles();
  
  toast(message, {
    duration: 3500,
    position: 'top-right',
    icon: '⚠️',
    ...styles.warning,
  });
};
