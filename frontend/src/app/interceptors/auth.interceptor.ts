import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';

/**
 * HTTP Interceptor for automatic JWT token attachment and error handling
 * This interceptor handles:
 * - Automatic JWT token attachment to requests
 * - Global error handling for HTTP responses
 * - Authentication failure redirects
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const errorHandler = inject(ErrorHandlerService);

  // Get JWT token from localStorage
  const token = getAuthToken();

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token && shouldAttachToken(req)) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Add common headers
  authReq = authReq.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  // Process the request and handle errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors globally
      if (error.status === 401) {
        handleAuthenticationError(router, errorHandler);
        return throwError(() => error);
      }

      // Handle other errors with the error handler service
      return errorHandler.handleHttpError(error);
    })
  );
};

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch (error) {
    console.warn('Failed to access localStorage for auth token:', error);
    return null;
  }
}

/**
 * Determine if authorization header should be attached to the request
 */
function shouldAttachToken(req: HttpRequest<unknown>): boolean {
  // Don't attach token to public endpoints
  const publicEndpoints = ['/auth/login', '/auth/register', '/health'];

  // Don't attach token to external APIs
  if (req.url.startsWith('http') && !req.url.includes(window.location.origin)) {
    return false;
  }

  // Check if it's a public endpoint
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    req.url.includes(endpoint)
  );

  return !isPublicEndpoint;
}

/**
 * Handle authentication errors (401 Unauthorized)
 */
function handleAuthenticationError(
  router: Router,
  errorHandler: ErrorHandlerService
): void {
  // Clear stored authentication data
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }

  // Display error message
  errorHandler.displayError('Your session has expired. Please log in again.', {
    severity: 'warning',
    navigateOnError: '/login',
  });

  // Redirect to login page
  router.navigate(['/login']);
}

/**
 * Additional interceptor for request/response logging in development
 */
export const loggingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const startTime = Date.now();

  // Log request in development mode
  if (!isProduction()) {
    console.log('HTTP Request:', {
      method: req.method,
      url: req.url,
      headers: req.headers.keys().reduce((acc, key) => {
        // Don't log sensitive headers
        if (key.toLowerCase() === 'authorization') {
          acc[key] = '[REDACTED]';
        } else {
          acc[key] = req.headers.get(key);
        }
        return acc;
      }, {} as Record<string, string | null>),
      body: req.body,
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isProduction()) {
        const duration = Date.now() - startTime;
        console.error('HTTP Error Response:', {
          method: req.method,
          url: req.url,
          status: error.status,
          statusText: error.statusText,
          duration: `${duration}ms`,
          error: error.error,
        });
      }
      return throwError(() => error);
    })
  );
};

/**
 * Check if running in production mode
 */
function isProduction(): boolean {
  return false; // Will be set based on Angular build configuration
}

/**
 * Token management utilities
 */
export const TokenManager = {
  /**
   * Store authentication token
   */
  setToken(token: string): void {
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  },

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return getAuthToken();
  },

  /**
   * Remove authentication token
   */
  removeToken(): void {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.warn('Invalid JWT token format:', error);
      this.removeToken();
      return false;
    }
  },

  /**
   * Get user data from token
   */
  getUserData(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch (error) {
      console.warn('Failed to parse token payload:', error);
      return null;
    }
  },
};
