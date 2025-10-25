import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild,
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.redirectToLogin(url);
      return of(false);
    }

    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.handleUnauthorizedAccess();
      return of(false);
    }

    // Verify token is still valid
    return this.authService.verifyToken().pipe(
      map(() => {
        // Token is valid and user is admin
        return true;
      }),
      catchError(() => {
        // Token is invalid, redirect to login
        this.redirectToLogin(url);
        return of(false);
      })
    );
  }

  private redirectToLogin(returnUrl: string): void {
    // Store the intended URL to redirect after login
    localStorage.setItem('returnUrl', returnUrl);
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl } 
    });
  }

  private handleUnauthorizedAccess(): void {
    // User is authenticated but not admin
    // Redirect to user dashboard with error message
    this.router.navigate(['/dashboard'], {
      queryParams: { 
        error: 'insufficient_permissions',
        message: 'Admin access required' 
      }
    });
  }
}