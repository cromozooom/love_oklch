import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Define interfaces locally to avoid import issues
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectAfterLogin();
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password, rememberMe } = this.loginForm.value;

      const loginRequest: LoginRequest = {
        email,
        password,
        rememberMe,
      };

      this.authService.login(loginRequest).subscribe({
        next: (response: LoginResponse) => {
          this.isLoading = false;
          if (response.success) {
            // Login successful - redirect user
            this.redirectAfterLogin();
          } else {
            this.errorMessage = response.message || 'Login failed';
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.handleLoginError(error);
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private redirectAfterLogin(): void {
    // Redirect all authenticated users to home page
    this.router.navigate(['/home']);
  }

  private handleLoginError(error: any): void {
    if (error.status === 401) {
      this.errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.status === 429) {
      this.errorMessage = 'Too many login attempts. Please try again later.';
    } else if (error.status === 0) {
      this.errorMessage =
        'Unable to connect to the server. Please check your internet connection.';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `Password must be at least ${minLength} characters long`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      email: 'Email',
      password: 'Password',
    };
    return displayNames[fieldName] || fieldName;
  }
}
