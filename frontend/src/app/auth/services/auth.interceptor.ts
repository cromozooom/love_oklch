import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Token key constant (must match AuthService)
  private readonly TOKEN_KEY = 'auth_token';
  private readonly router = inject(Router);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Skip auth header for login and refresh requests
    if (this.shouldSkipAuth(req.url)) {
      return next.handle(req);
    }

    // Add auth token to request
    const authReq = this.addAuthHeader(req);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors by redirecting to login
        if (error.status === 401) {
          this.handle401Error();
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Check if request should skip authentication
   */
  private shouldSkipAuth(url: string): boolean {
    const skipUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];

    return skipUrls.some((skipUrl) => url.includes(skipUrl));
  }

  /**
   * Add authentication header to request
   * Gets token directly from localStorage to avoid circular dependency
   */
  private addAuthHeader(req: HttpRequest<any>): HttpRequest<any> {
    // Get token directly from localStorage to avoid circular dependency with AuthService
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (token) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Handle 401 unauthorized errors by clearing auth and redirecting to login
   */
  private handle401Error(): void {
    // Clear stored auth data
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_remember');

    // Redirect to login
    this.router.navigate(['/auth/login']);
  }
}
