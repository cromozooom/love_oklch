import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      role: 'admin' | 'user';
      name?: string;
    };
  };
  error?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3001/api/v1';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly REMEMBER_KEY = 'auth_remember';

  // Auth state management
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private initializeAuthState(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (token && user) {
      this.setAuthState({
        isAuthenticated: true,
        user,
        token,
      });

      // Verify token is still valid, but only if we have both token and user
      this.verifyToken().subscribe({
        error: () => {
          // Only logout if token verification fails, not on initialization
          if (this.isAuthenticated()) {
            this.logout();
          }
        },
      });
    } else {
      // No stored credentials, ensure clean state
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }
  }

  /**
   * Login user with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.handleLoginSuccess(response.data, credentials.rememberMe);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user and clear all stored data
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/logout`, {}).pipe(
      tap(() => this.handleLogoutSuccess()),
      catchError(() => {
        // Even if logout fails on server, clear local state
        this.handleLogoutSuccess();
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.authStateSubject.value.user?.role === 'admin';
  }

  /**
   * Check if user is regular user
   */
  isUser(): boolean {
    return this.authStateSubject.value.user?.role === 'user';
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return this.authStateSubject.value.token;
  }

  /**
   * Verify if current token is valid
   */
  verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http
      .get<{ valid: boolean }>(`${this.API_URL}/auth/verify`)
      .pipe(
        map((response) => response.valid),
        catchError(() => {
          this.logout();
          return throwError(() => new Error('Token verification failed'));
        })
      );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<string> {
    return this.http
      .post<{ token: string }>(`${this.API_URL}/auth/refresh`, {})
      .pipe(
        map((response) => response.token),
        tap((newToken) => {
          const currentState = this.authStateSubject.value;
          this.setAuthState({
            ...currentState,
            token: newToken,
          });
          this.storeToken(newToken);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(
    data: LoginResponse['data'],
    rememberMe?: boolean
  ): void {
    if (!data) return;

    const authState: AuthState = {
      isAuthenticated: true,
      user: data.user,
      token: data.token,
    };

    this.setAuthState(authState);
    this.storeAuthData(data, rememberMe);

    // Redirect based on user role
    if (data.user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Handle successful logout
   */
  private handleLogoutSuccess(): void {
    this.setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });

    this.clearStoredData();

    // Only redirect to login if not already on login page
    if (this.router.url !== '/login') {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Set authentication state
   */
  private setAuthState(state: AuthState): void {
    this.authStateSubject.next(state);
  }

  /**
   * Store authentication data in local/session storage
   */
  private storeAuthData(
    data: LoginResponse['data'],
    rememberMe?: boolean
  ): void {
    if (!data) return;

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.TOKEN_KEY, data.token);
    storage.setItem(this.USER_KEY, JSON.stringify(data.user));

    if (rememberMe) {
      localStorage.setItem(this.REMEMBER_KEY, 'true');
    }
  }

  /**
   * Store token in appropriate storage
   */
  private storeToken(token: string): void {
    const rememberMe = localStorage.getItem(this.REMEMBER_KEY) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get stored token from storage
   */
  private getStoredToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  /**
   * Get stored user from storage
   */
  private getStoredUser(): User | null {
    const userStr =
      localStorage.getItem(this.USER_KEY) ||
      sessionStorage.getItem(this.USER_KEY);

    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredData(): void {
    // Clear from both storages
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
    });

    localStorage.removeItem(this.REMEMBER_KEY);
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid email or password';
          break;
        case 403:
          errorMessage = 'Access denied';
          break;
        case 404:
          errorMessage = 'Service not found';
          break;
        case 429:
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || 'Login failed';
      }
    }

    return throwError(() => new Error(errorMessage));
  };

  /**
   * Auto-logout when token expires
   */
  startTokenExpirationTimer(expiresIn: number): void {
    setTimeout(() => {
      this.logout().subscribe();
    }, expiresIn * 1000);
  }

  /**
   * Check if user has specific permission (for future use)
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // For now, admin has all permissions
    if (user.role === 'admin') return true;

    // TODO: Implement granular permissions system
    return false;
  }

  /**
   * Get user initials for avatar display
   */
  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '';

    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    return user.email[0].toUpperCase();
  }
}
