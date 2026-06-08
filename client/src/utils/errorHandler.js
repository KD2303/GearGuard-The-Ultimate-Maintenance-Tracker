"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showWarningToast = exports.showInfoToast = exports.showSuccessToast = exports.showErrorToast = exports.handleApiError = void 0;
var react_hot_toast_1 = require("react-hot-toast");
/**
 * Get appropriate toast styling based on current theme
 */
var getToastStyles = function () {
    var isDarkMode = document.documentElement.classList.contains('dark');
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
var handleApiError = function (error) {
    // Network error (no response from server)
    if (error instanceof Error && !('response' in error)) {
        return {
            message: 'Unable to connect to server. Please check your internet connection and try again.',
            type: 'network',
        };
    }
    // Axios error with response
    if (error && typeof error === 'object' && 'response' in error) {
        var axiosError = error;
        if (!axiosError.response) {
            return {
                message: 'Unable to connect to server. Please try again later.',
                type: 'network',
            };
        }
        var _a = axiosError.response, status_1 = _a.status, data_1 = _a.data;
        var statusCode = status_1;
        var extractMessage = function (defaultMsg) {
            var _a;
            if (typeof (data_1 === null || data_1 === void 0 ? void 0 : data_1.message) === 'string')
                return data_1.message;
            if (typeof (data_1 === null || data_1 === void 0 ? void 0 : data_1.error) === 'string')
                return data_1.error;
            if (((_a = data_1 === null || data_1 === void 0 ? void 0 : data_1.error) === null || _a === void 0 ? void 0 : _a.message) && typeof data_1.error.message === 'string')
                return data_1.error.message;
            return defaultMsg;
        };
        // Handle specific status codes
        switch (statusCode) {
            case 400:
                return {
                    message: extractMessage('Invalid request. Please check your input.'),
                    statusCode: statusCode,
                    type: 'validation',
                };
            case 401:
                return {
                    message: extractMessage('Invalid email or password'),
                    statusCode: statusCode,
                    type: 'authentication',
                };
            case 403:
                return {
                    message: extractMessage('Access denied. You do not have permission.'),
                    statusCode: statusCode,
                    type: 'authentication',
                };
            case 404:
                return {
                    message: extractMessage('Resource not found'),
                    statusCode: statusCode,
                    type: 'validation',
                };
            case 422:
                return {
                    message: extractMessage('Validation failed. Please check your input.'),
                    statusCode: statusCode,
                    type: 'validation',
                };
            case 429:
                return {
                    message: extractMessage('Too many requests. Please wait a moment and try again.'),
                    statusCode: statusCode,
                    type: 'validation',
                };
            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    message: extractMessage('Server error. Please try again later.'),
                    statusCode: statusCode,
                    type: 'server',
                };
            default:
                return {
                    message: extractMessage('Something went wrong. Please try again.'),
                    statusCode: statusCode,
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
exports.handleApiError = handleApiError;
/**
 * Show error toast with proper styling based on error type
 */
var showErrorToast = function (error, customMessage) {
    var apiError = (0, exports.handleApiError)(error);
    var message = customMessage || apiError.message;
    var styles = getToastStyles();
    react_hot_toast_1.default.error(message, __assign({ duration: 4000, position: 'top-right' }, styles.error));
    return apiError;
};
exports.showErrorToast = showErrorToast;
/**
 * Show success toast with consistent styling
 */
var showSuccessToast = function (message) {
    var styles = getToastStyles();
    react_hot_toast_1.default.success(message, __assign({ duration: 3000, position: 'top-right' }, styles.success));
};
exports.showSuccessToast = showSuccessToast;
/**
 * Show info toast with consistent styling
 */
var showInfoToast = function (message) {
    var styles = getToastStyles();
    (0, react_hot_toast_1.default)(message, __assign({ duration: 3000, position: 'top-right', icon: 'ℹ️' }, styles.info));
};
exports.showInfoToast = showInfoToast;
/**
 * Show warning toast with consistent styling
 */
var showWarningToast = function (message) {
    var styles = getToastStyles();
    (0, react_hot_toast_1.default)(message, __assign({ duration: 3500, position: 'top-right', icon: '⚠️' }, styles.warning));
};
exports.showWarningToast = showWarningToast;
