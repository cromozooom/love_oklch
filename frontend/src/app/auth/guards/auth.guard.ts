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
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthentication(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthentication(state.url);
  }

  private checkAuthentication(url: string): Observable<boolean> {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.redirectToLogin(url);
      return of(false);
    }

    // Verify token is still valid
    return this.authService.verifyToken().pipe(
      map(() => {
        // Token is valid
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
}