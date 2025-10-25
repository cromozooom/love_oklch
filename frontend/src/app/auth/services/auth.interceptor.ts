import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  // Token key constant (must match AuthService)
  private readonly TOKEN_KEY = 'auth_token';

  constructor(private authService: AuthService) {}

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
        // Handle 401 errors with token refresh
        if (error.status === 401 && this.authService.isAuthenticated()) {
          return this.handle401Error(authReq, next);
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
   * Handle 401 unauthorized errors with token refresh
   */
  private handle401Error(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);

          // Retry original request with new token
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          return next.handle(retryReq);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout().subscribe();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for refresh to complete
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next.handle(retryReq);
        })
      );
    }
  }
}
