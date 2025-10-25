import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

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
    // Simply check if user is authenticated based on current state
    if (this.authService.isAuthenticated()) {
      return of(true);
    }

    // Not authenticated, redirect to login
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
}
