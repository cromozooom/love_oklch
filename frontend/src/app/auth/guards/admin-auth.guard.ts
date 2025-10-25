import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAdminAccess(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAdminAccess(state.url);
  }

  private checkAdminAccess(url: string): Observable<boolean> {
    console.log('AdminAuthGuard: Checking admin access for URL:', url);

    // First, check if we have stored credentials that suggest we should wait
    const hasStoredToken = !!localStorage.getItem('auth_token');
    const hasStoredUser = !!localStorage.getItem('auth_user');

    console.log('AdminAuthGuard: Has stored token:', hasStoredToken);
    console.log('AdminAuthGuard: Has stored user:', hasStoredUser);

    if (hasStoredToken && hasStoredUser) {
      // We have stored credentials, wait a moment for AuthService to initialize
      console.log(
        'AdminAuthGuard: Found stored credentials, waiting for auth initialization...'
      );

      return timer(500).pipe(
        // Wait 500ms for auth to initialize
        switchMap(() => this.authService.authState$),
        take(1),
        map((authState) => {
          console.log('AdminAuthGuard: Auth state after wait:', authState);
          return this.evaluateAuthState(authState, url);
        }),
        catchError((error) => {
          console.log('AdminAuthGuard: Error after wait:', error);
          return this.fallbackAuthCheck(url);
        })
      );
    } else {
      // No stored credentials, check current state immediately
      console.log(
        'AdminAuthGuard: No stored credentials, checking current state...'
      );

      return this.authService.authState$.pipe(
        take(1),
        map((authState) => {
          console.log('AdminAuthGuard: Current auth state:', authState);
          return this.evaluateAuthState(authState, url);
        }),
        catchError((error) => {
          console.log('AdminAuthGuard: Error checking current state:', error);
          this.redirectToLogin(url);
          return of(false);
        })
      );
    }
  }

  private evaluateAuthState(authState: any, url: string): boolean {
    // Check if user is authenticated
    const isAuthenticated = authState.isAuthenticated;
    console.log('AdminAuthGuard: Is authenticated:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('AdminAuthGuard: Not authenticated, redirecting to login');
      this.redirectToLogin(url);
      return false;
    }

    // Check if user is admin
    const isAdmin = authState.user?.role === 'admin';
    console.log('AdminAuthGuard: Is admin:', isAdmin);
    console.log('AdminAuthGuard: Current user:', authState.user);

    if (!isAdmin) {
      console.log('AdminAuthGuard: Not admin, redirecting to dashboard');
      this.handleUnauthorizedAccess();
      return false;
    }

    console.log('AdminAuthGuard: Access granted!');
    return true;
  }

  private fallbackAuthCheck(url: string): Observable<boolean> {
    console.log('AdminAuthGuard: Performing fallback auth check...');

    // Direct check of localStorage as last resort
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('AdminAuthGuard: Fallback user data:', user);

        if (user.role === 'admin') {
          console.log(
            'AdminAuthGuard: Fallback - valid admin found in localStorage'
          );
          return of(true);
        }
      } catch (e) {
        console.log('AdminAuthGuard: Error parsing stored user data:', e);
      }
    }

    console.log('AdminAuthGuard: Fallback failed, redirecting to login');
    this.redirectToLogin(url);
    return of(false);
  }

  private redirectToLogin(returnUrl: string): void {
    // Store the intended URL to redirect after login
    localStorage.setItem('returnUrl', returnUrl);
    this.router.navigate(['/login'], {
      queryParams: { returnUrl },
    });
  }

  private handleUnauthorizedAccess(): void {
    // User is authenticated but not admin
    // Redirect to user dashboard with error message
    this.router.navigate(['/dashboard'], {
      queryParams: {
        error: 'insufficient_permissions',
        message: 'Admin access required',
      },
    });
  }
}
