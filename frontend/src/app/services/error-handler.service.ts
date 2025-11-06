import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';

/**
 * Standardized error response interface from backend API
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

/**
 * Internal error handling types
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorDisplayOptions {
  severity?: ErrorSeverity;
  duration?: number;
  showRetry?: boolean;
  navigateOnError?: string;
}

/**
 * Error handling service for consistent error management across the application
 * Provides standardized error display, logging, and user feedback using browser notifications
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private readonly router = inject(Router);
  private readonly notifications: Map<string, number> = new Map();

  /**
   * Handle HTTP errors from API calls
   */
  handleHttpError(
    error: HttpErrorResponse,
    options?: ErrorDisplayOptions
  ): Observable<never> {
    let errorMessage: string;
    let errorCode: string = 'UNKNOWN_ERROR';

    if (error.error && this.isApiError(error.error)) {
      // API error with standardized format
      errorMessage = error.error.error.message;
      errorCode = error.error.error.code;

      // Handle specific error codes
      switch (errorCode) {
        case 'AUTHENTICATION_REQUIRED':
        case 'INVALID_TOKEN':
          this.handleAuthenticationError();
          return throwError(() => error);

        case 'SUBSCRIPTION_LIMIT_EXCEEDED':
          this.handleSubscriptionLimitError(error.error.error);
          return throwError(() => error);

        case 'PROJECT_NOT_FOUND':
          this.handleNotFoundError('Project not found');
          return throwError(() => error);

        default:
          this.displayError(errorMessage, options);
      }
    } else {
      // Generic HTTP error
      switch (error.status) {
        case 0:
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 401:
          this.handleAuthenticationError();
          return throwError(() => error);
        case 403:
          errorMessage =
            'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `An error occurred (${error.status}). Please try again.`;
      }

      this.displayError(errorMessage, options);
    }

    // Log error for debugging
    console.error('HTTP Error:', {
      status: error.status,
      message: errorMessage,
      code: errorCode,
      url: error.url,
      timestamp: new Date().toISOString(),
    });

    return throwError(() => error);
  }

  /**
   * Handle general application errors
   */
  handleError(
    error: any,
    context?: string,
    options?: ErrorDisplayOptions
  ): void {
    const errorMessage = error?.message || 'An unexpected error occurred';

    console.error('Application Error:', {
      error,
      context,
      timestamp: new Date().toISOString(),
    });

    this.displayError(errorMessage, options);
  }

  /**
   * Display user-friendly error messages using toast notifications
   */
  displayError(message: string, options?: ErrorDisplayOptions): void {
    const severity = options?.severity || 'error';
    const duration = options?.duration || (severity === 'error' ? 8000 : 4000);

    // Create notification element
    const notification = this.createNotification(message, severity, duration);
    document.body.appendChild(notification);

    // Handle navigation on error
    if (options?.navigateOnError) {
      setTimeout(() => {
        this.router.navigate([options.navigateOnError]);
      }, 1000);
    }
  }

  /**
   * Display success messages
   */
  displaySuccess(message: string, duration: number = 3000): void {
    this.displayError(message, { severity: 'info', duration });
  }

  /**
   * Display warning messages
   */
  displayWarning(message: string, duration: number = 5000): void {
    this.displayError(message, { severity: 'warning', duration });
  }

  /**
   * Display info messages
   */
  displayInfo(message: string, duration: number = 4000): void {
    this.displayError(message, { severity: 'info', duration });
  }

  /**
   * Create notification DOM element
   */
  private createNotification(
    message: string,
    severity: ErrorSeverity,
    duration: number
  ): HTMLElement {
    const notification = document.createElement('div');
    const notificationId = `notification-${Date.now()}`;

    notification.id = notificationId;
    notification.className = `
      fixed top-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 
      transform transition-all duration-300 translate-x-full
      ${this.getSeverityClasses(severity)}
    `;

    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <p class="text-sm font-medium">${this.getSeverityIcon(
            severity
          )} ${this.getSeverityTitle(severity)}</p>
          <p class="mt-1 text-sm opacity-90">${message}</p>
        </div>
        <button class="ml-4 text-sm opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);

    return notification;
  }

  /**
   * Get CSS classes for notification severity
   */
  private getSeverityClasses(severity: ErrorSeverity): string {
    switch (severity) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-orange-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  /**
   * Get icon for notification severity
   */
  private getSeverityIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Get title for notification severity
   */
  private getSeverityTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Notification';
    }
  }

  /**
   * Handle authentication errors (redirect to login)
   */
  private handleAuthenticationError(): void {
    this.displayError('Session expired. Please log in again.', {
      navigateOnError: '/login',
    });
  }

  /**
   * Handle subscription limit errors with upgrade prompt
   */
  private handleSubscriptionLimitError(errorDetails: any): void {
    const details = errorDetails.details;
    let message = errorDetails.message;

    if (details?.subscriptionType === 'default') {
      message += ' Upgrade to premium for unlimited projects.';
    }

    this.displayError(message, {
      severity: 'warning',
      duration: 10000,
      showRetry: false,
    });
  }

  /**
   * Handle not found errors
   */
  private handleNotFoundError(message: string): void {
    this.displayError(message, {
      navigateOnError: '/dashboard',
    });
  }

  /**
   * Check if error response follows API error format
   */
  private isApiError(error: any): error is ApiError {
    return (
      error &&
      typeof error === 'object' &&
      error.success === false &&
      error.error &&
      typeof error.error.code === 'string' &&
      typeof error.error.message === 'string'
    );
  }

  /**
   * Create error handler function for observables
   */
  createErrorHandler<T>(context?: string, options?: ErrorDisplayOptions) {
    return (error: any): Observable<T> => {
      if (error instanceof HttpErrorResponse) {
        return this.handleHttpError(error, options);
      } else {
        this.handleError(error, context, options);
        return throwError(() => error);
      }
    };
  }

  /**
   * Validate response and handle API errors
   */
  validateApiResponse<T>(response: any): T {
    if (response && response.success === false) {
      throw new Error(response.error?.message || 'API request failed');
    }
    return response.data || response;
  }
}
