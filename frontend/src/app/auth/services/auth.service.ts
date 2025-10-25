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
    console.log('🔄 AuthService: Initializing auth state...');

    const token = this.getStoredToken();
    const user = this.getStoredUser();

    console.log('🔍 Token exists:', !!token);
    console.log('🔍 User exists:', !!user);
    console.log('🔍 User data:', user);

    if (token && user) {
      console.log('🔍 Both token and user found, checking token validity...');

      // Check if token looks valid before making HTTP request
      if (this.isTokenLikelyValid(token)) {
        console.log('✅ Token appears valid, setting authenticated state');

        // Set auth state first
        this.setAuthState({
          isAuthenticated: true,
          user,
          token,
        });

        // Verify token in the background only if it looks potentially valid
        this.verifyTokenSilently().subscribe({
          next: (isValid) => {
            console.log('🔍 Token verification result:', isValid);
            if (!isValid) {
              // Token is invalid, clear auth state
              console.log('❌ Token invalid, clearing auth state');
              this.setAuthState({
                isAuthenticated: false,
                user: null,
                token: null,
              });
              this.clearStoredData();
            } else {
              console.log('✅ Token verified successfully');
            }
          },
          error: (err) => {
            // Token verification failed, clear auth state silently
            console.log('❌ Token verification failed:', err);
            this.setAuthState({
              isAuthenticated: false,
              user: null,
              token: null,
            });
            this.clearStoredData();
          },
        });
      } else {
        // Token format is clearly invalid, clear immediately without HTTP call
        console.log(
          '❌ Invalid token format detected, clearing stored authentication'
        );
        this.clearStoredData();
        this.setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      }
    } else {
      // No stored credentials, ensure clean state
      console.log(
        '🔄 AuthService: No stored credentials found, setting unauthenticated state'
      );
      this.setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }
  }

  /**
   * Check if a token has a valid format without making HTTP request
   */
  private isTokenLikelyValid(token: string): boolean {
    if (!token || token.trim() === '') {
      return false;
    }

    // Check for JWT format (three parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if all parts exist and are not empty
    // Server will validate the actual token content
    const allPartsNonEmpty = parts.every((part) => part.length > 0);

    if (!allPartsNonEmpty) {
      return false;
    }

    return true;
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
   * Get current user with full details
   * SECURITY: Gets user details from JWT token instead of localStorage
   */
  getCurrentUser(): User | null {
    const storedUser = this.authStateSubject.value.user;
    if (!storedUser) return null;

    // If we have minimal stored data, try to get full data from JWT
    const token = this.getToken();
    if (token && (!storedUser.email || !storedUser.name)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          id: storedUser.id,
          role: storedUser.role,
          email: payload.email || '',
          name: payload.name || '',
        };
      } catch {
        // If token parsing fails, return what we have
        return storedUser;
      }
    }

    return storedUser;
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return this.authStateSubject.value.token;
  }

  /**
   * Verify if current token is valid (for initialization - doesn't auto-logout)
   */
  private verifyTokenSilently(): Observable<boolean> {
    const token = this.getStoredToken(); // Get directly from storage to avoid circular dependency
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    // Manually add Authorization header to avoid circular dependency with interceptor
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    return this.http
      .get<{ success: boolean; data?: { user: User } }>(
        `${this.API_URL}/auth/verify`,
        { headers }
      )
      .pipe(
        map((response) => {
          return response.success;
        }),
        catchError(() => {
          // Don't logout during silent verification
          return throwError(() => new Error('Token verification failed'));
        })
      );
  }

  /**
   * Verify if current token is valid (for user actions - auto-logout on failure)
   */
  verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    return this.http
      .get<{ success: boolean; data?: { user: User } }>(
        `${this.API_URL}/auth/verify`
      )
      .pipe(
        map((response) => response.success),
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
   * Store authentication data in local storage for persistence
   * SECURITY: Store minimal user data to reduce exposure risk
   */
  private storeAuthData(
    data: LoginResponse['data'],
    rememberMe?: boolean
  ): void {
    if (!data) return;

    // Always use localStorage for persistence across page refreshes
    // rememberMe controls session duration, not storage type
    localStorage.setItem(this.TOKEN_KEY, data.token);

    // SECURITY: Store minimal user data - only what's needed for UI
    const minimalUser = {
      id: data.user.id,
      role: data.user.role,
      // Don't store email or name in localStorage for security
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(minimalUser));

    if (rememberMe) {
      localStorage.setItem(this.REMEMBER_KEY, 'true');
    } else {
      // Store that this is a session-only login for future reference
      localStorage.setItem(this.REMEMBER_KEY, 'false');
    }
  }

  /**
   * Store token in localStorage for persistence
   */
  private storeToken(token: string): void {
    // Always use localStorage for token persistence
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get stored token from localStorage
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);

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

    // Future: Implement granular permissions system
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
