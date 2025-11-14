import { Injectable, signal, computed, effect } from '@angular/core';
import { ThemeMode, AppliedTheme } from '../models/theme.models';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'love-oklch-theme';

  // Signals for reactive state
  private _currentMode = signal<ThemeMode>('light');
  private _isAuthenticated = signal<boolean>(false);

  // Public computed signals
  public readonly currentMode = this._currentMode.asReadonly();
  public readonly appliedTheme = computed<AppliedTheme>(() => {
    const mode = this._currentMode();
    if (mode === 'system') {
      return this.getSystemPreference();
    }
    return mode;
  });

  public readonly isThemeControlsVisible = computed(() =>
    this._isAuthenticated()
  );

  constructor() {
    // Initialize theme from localStorage or default
    this.initializeTheme();

    // Apply theme changes to DOM
    effect(() => {
      this.applyThemeToDOM(this.appliedTheme());
    });

    // Listen for system theme changes when in system mode
    this.setupSystemThemeListener();
  }

  setTheme(mode: ThemeMode): void {
    if (!this._isAuthenticated()) {
      console.warn('Theme switching is only available for authenticated users');
      return;
    }

    this._currentMode.set(mode);
    this.saveToLocalStorage(mode);
  }

  setAuthenticated(isAuthenticated: boolean): void {
    this._isAuthenticated.set(isAuthenticated);
  }

  private initializeTheme(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        this._currentMode.set(saved as ThemeMode);
      }
    } catch (error) {
      console.warn('Could not load theme from localStorage:', error);
      // Graceful degradation - keep default light theme
    }
  }

  private saveToLocalStorage(mode: ThemeMode): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Could not save theme to localStorage:', error);
      // Continue without persistence
    }
  }

  private getSystemPreference(): AppliedTheme {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light'; // fallback
  }

  private applyThemeToDOM(theme: AppliedTheme): void {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;

      // Remove existing theme classes
      html.classList.remove('light', 'dark');

      // Add the new theme class
      html.classList.add(theme);
    }
  }

  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        // Trigger signal update when system preference changes
        if (this._currentMode() === 'system') {
          this._currentMode.set('system'); // Force recalculation
        }
      });
    }
  }
}
